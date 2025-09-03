import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // <- este
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log suave para detectar envs faltantes (no tumba la app)
for (const [k, v] of Object.entries(cfg)) {
  if (!v) console.warn(`[firebase] Falta variable: ${k}`);
}

let app: FirebaseApp;
try {
  app = getApps().length ? getApp() : initializeApp(cfg);
} catch (e) {
  console.error("[firebase] init error:", e);
  // @ts-expect-error
  app = undefined;
}

export const db: Firestore | undefined = app ? getFirestore(app) : undefined;
export const auth: Auth | undefined = app ? getAuth(app) : undefined;
