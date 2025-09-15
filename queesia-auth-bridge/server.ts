// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Firebase Admin (API modular)
import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/* -------------------- Init Firebase Admin -------------------- */
// Opción A: credenciales en base64 en FIREBASE_SERVICE_ACCOUNT
// Opción B: GOOGLE_APPLICATION_CREDENTIALS ya apunta al .json (applicationDefault)
if (!getApps().length) {
  let options: Parameters<typeof initializeApp>[0];

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const json = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT,
      "base64"
    ).toString("utf8");
    options = { credential: cert(JSON.parse(json)) };
  } else {
    // Tomará GOOGLE_APPLICATION_CREDENTIALS si está definida
    options = { credential: applicationDefault() };
  }

  initializeApp(options);
}

/* -------------------- App & middlewares -------------------- */
const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS con allowlist desde .env
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED.includes(origin)) return cb(null, true);
      cb(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

/* -------------------- Cookie config -------------------- */
const COOKIE_NAME = process.env.COOKIE_NAME ?? "qsess";
const COOKIE_DOMAIN =
  (process.env.COOKIE_DOMAIN ?? "").trim() || undefined; // undefined para localhost
const COOKIE_SECURE = String(process.env.COOKIE_SECURE ?? "true") === "true";
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ?? "lax") as
  | "lax"
  | "strict"
  | "none";
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 14);

/* -------------------- Routes -------------------- */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV ?? "development" });
});

// Recibe { idToken } desde el front, lo verifica y setea cookie httpOnly
app.post("/api/login", async (req, res) => {
  try {
    const { idToken } = req.body ?? {};
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const decoded = await getAuth().verifyIdToken(idToken, true);

    const maxAge = SESSION_DAYS * 24 * 60 * 60 * 1000;
    res.cookie(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAMESITE,
      domain: COOKIE_DOMAIN === "localhost" ? undefined : COOKIE_DOMAIN,
      path: "/",
      maxAge,
    });

    res.json({ ok: true, uid: decoded.uid });
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "invalid-token" });
  }
});

// Limpia la cookie
app.post("/api/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    domain: COOKIE_DOMAIN === "localhost" ? undefined : COOKIE_DOMAIN,
    path: "/",
  });
  res.json({ ok: true });
});

// Opcional: lee cookie y valida
app.get("/api/me", async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "no-cookie" });
    const decoded = await getAuth().verifyIdToken(token, true);
    res.json({ ok: true, uid: decoded.uid, email: decoded.email ?? null });
  } catch (err) {
    res.status(401).json({ error: "invalid-cookie" });
  }
});

/* -------------------- Start -------------------- */
const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`Auth bridge listo en http://localhost:${PORT}`);
});
