// src/firebase.ts
import {
  initializeApp, getApps, getApp,
  type FirebaseApp, type FirebaseOptions
} from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const cfg: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// (opcional) avisar si falta algo
for (const [k, v] of Object.entries(cfg)) {
  if (!v) console.warn(`[firebase] Falta variable: ${k}`);
}

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(cfg);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

// Si quieres conservar el helper:
export const assertDb = () => db; // ahora es Firestore, no undefined
