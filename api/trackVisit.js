// /api/trackVisit.js
import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FB_PROJECT_ID,
      client_email: process.env.FB_CLIENT_EMAIL,
      private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = admin.firestore();

const EXCLUDE_EMAILS = (process.env.EXCLUDE_EMAILS || "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const EXCLUDE_UIDS = (process.env.EXCLUDE_UIDS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
const EXCLUDE_IP_HASHES = new Set(
  (process.env.EXCLUDE_IP_HASHES || "")
    .split(",").map(s => s.trim()).filter(Boolean)
);

function ipFromReq(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string") return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}
function hashIp(ip) {
  const pepper = process.env.IP_PEPPER || "change_me_long_random";
  return crypto.createHash("sha256").update(`${ip}|${pepper}`).digest("hex");
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method not allowed" });

    const { page } = req.body || {};
    if (!page) return res.status(400).json({ ok:false, error:"Missing page" });

    // (opcional) verificar ID token si viene para identificar correo/uid del user
    let user = null;
    const authz = req.headers.authorization; // "Bearer <idToken>"
    if (authz?.startsWith("Bearer ")) {
      try { user = await admin.auth().verifyIdToken(authz.slice(7)); } catch {}
    }

    const ipHash = hashIp(ipFromReq(req));

    // Exclusiones
    if (user?.uid && EXCLUDE_UIDS.includes(user.uid))      return res.json({ ok:true, excluded:"uid" });
    if (user?.email && EXCLUDE_EMAILS.includes(user.email.toLowerCase()))
      return res.json({ ok:true, excluded:"email" });
    if (EXCLUDE_IP_HASHES.has(ipHash))                     return res.json({ ok:true, excluded:"ip" });

    // Idempotencia por día/página
    const today = new Date().toISOString().slice(0,10);
    const visitDoc = db.collection("page_stats").doc(`${page}__${today}__${ipHash}`);
    const snap = await visitDoc.get();

    if (!snap.exists) {
      await visitDoc.set({
        page, date: today, ipHash,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const aggRef = db.collection("page_stats_daily").doc(`${page}__${today}`);
      await db.runTransaction(async (tx) => {
        const agg = await tx.get(aggRef);
        const visits = (agg.data()?.visits || 0) + 1;
        tx.set(aggRef, { page, date: today, visits }, { merge: true });
      });
    }

    res.json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:"Server error" });
  }
}
