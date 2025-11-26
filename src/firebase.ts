// src/firebase.ts — acepta VITE_FIREBASE_* (tuyas) o VITE_FB_* (fallback)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";


// Toma primero tus nombres VITE_FIREBASE_*, y si no existen usa VITE_FB_*
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    import.meta.env.VITE_FB_API_KEY,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ??
    import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    import.meta.env.VITE_FB_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error('[Firebase] Falta API key: revisa tu .env (VITE_FIREBASE_API_KEY)');
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);   // ✅ NUEVO