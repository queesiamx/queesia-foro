// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: ["https://foro.queesia.com", "http://localhost:5173"] });

admin.initializeApp();
const db = admin.firestore();

/**
 * 1) onPostCreate: incrementa repliesCount y lastActivityAt cuando nace un post
 */
exports.onPostCreate = functions.firestore
  .document("posts/{postId}")
  .onCreate(async (snap, ctx) => {
    const post = snap.data() || {};
    const threadId = post.threadId;
    if (!threadId) return null;

    const threadRef = db.collection("threads").doc(threadId);

    // Si el cliente aún no puso createdAt, usamos serverTimestamp
    const lastAt =
      post.createdAt ||
      admin.firestore.FieldValue.serverTimestamp();

    await threadRef.update({
      repliesCount: admin.firestore.FieldValue.increment(1),
      lastActivityAt: lastAt,
    });

    return null;
  });

/**
 * 2) hitThread: HTTP endpoint para sumar 1 vista al abrir el hilo
 *    - Llamado desde el front en ThreadPage useEffect
 */
exports.hitThread = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }
      const { threadId } = req.body || {};
      if (!threadId) return res.status(400).json({ ok: false, error: "Missing threadId" });

      const ref = db.collection("threads").doc(threadId);
      await ref.update({
        viewsCount: admin.firestore.FieldValue.increment(1),
        // opcional: también podrías tocar lastActivityAt aquí si quisieras
      });

      return res.json({ ok: true });
    } catch (e) {
      console.error("hitThread error:", e);
      return res.status(500).json({ ok: false, error: e.message });
    }
  });
});
