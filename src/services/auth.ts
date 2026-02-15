// src/services/auth.ts  — RTC-CO
// Único origen de Firebase en el cliente
import { auth } from '@/firebase';
import type { UserCredential } from "firebase/auth";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export type Session = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  token?: string;
};

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/* ==== Bridge SSO (unificación de sesión) ==== */
async function safeJson(r: Response) {
  try { return await r.json(); } catch { return {}; }
}

function getBridgeUrl() {
  // Debe ser URL completa al endpoint (no base), ejemplo:
  // https://expertos.queesia.com/api/trackVisit
  return (import.meta.env.VITE_AUTH_BRIDGE_URL || "").replace(/\/+$/, "");
}


async function ssoWhoAmI() {
  const BRIDGE_URL = getBridgeUrl();
  if (!BRIDGE_URL) return { ok: false, reached: false as const };

  try {
    const r = await fetch(`${BRIDGE_URL}?action=me`, { credentials: "include" });
    const data = await safeJson(r);
    // el bridge antiguo devuelve { user: ... } cuando ok
    const ok = r.ok && !!(data as any)?.user;
    return { ok, reached: true as const, ...data };
  } catch {
    // Bridge apagado / DNS / CORS / etc. (NO cerramos sesión por esto)
    return { ok: false, reached: false as const };
  }
}


async function ssoGetCustomToken() {
  const BRIDGE_URL = getBridgeUrl();
  if (!BRIDGE_URL) return { ok: false, reached: false as const };

  try {
    const r = await fetch(`${BRIDGE_URL}?action=customtoken`, { credentials: "include" });
    const data = await safeJson(r);
    return { ok: r.ok, reached: true as const, ...data }; // espera { customToken }
  } catch {
    return { ok: false, reached: false as const };
  }
}

async function ssoLogout() {
  const BRIDGE_URL = getBridgeUrl();
  if (!BRIDGE_URL) return { ok: false, reached: false as const };

  try {
    const r = await fetch(`${BRIDGE_URL}?action=logout`, {
      method: "POST",
      credentials: "include",
    });
    return { ok: r.ok, reached: true as const };
  } catch {
    return { ok: false, reached: false as const };
  }
}


async function ssoLoginWithIdToken(idToken: string) {
  const BRIDGE_URL = getBridgeUrl();
  if (!BRIDGE_URL) return { ok: false };
  try {
    const r = await fetch(`${BRIDGE_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    const data = await safeJson(r);
    return { ok: r.ok, ...data };
  } catch {
    return { ok: false };
  }
}

/* ==== Login / Logout básicos ==== */
export function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, provider);
}
export function logout() {
  return signOut(auth);
}

/* ==== Login unificado (SSO -> Firebase custom token) ==== */
export async function loginUnified(): Promise<void> {
  console.log("[loginUnified] start", {
    bridge: import.meta.env.VITE_AUTH_BRIDGE_URL,
    href: window.location.href,
  });

  const who = await ssoWhoAmI();
  console.log("[loginUnified] whoami", who);

  if (who?.ok) {
    const tok = await ssoGetCustomToken();
    console.log("[loginUnified] token resp", tok);

    const customToken = (tok as any)?.customToken;
    if (!tok?.ok || !customToken) throw new Error("SSO_CUSTOM_TOKEN_FAILED");

    await signInWithCustomToken(auth, customToken);
    console.log("[loginUnified] signed in with custom token");
    return;
  }

  console.log("[loginUnified] fallback popup");
  const cred = await loginWithGoogle();
  // Importante: “avisa” al bridge para que otros subdominios puedan ver sesión (cookie/bridge)
  try {
    const idToken = await cred.user.getIdToken();
    const resp = await ssoLoginWithIdToken(idToken);
    console.log("[loginUnified] bridge login resp", resp);
  } catch (e) {
    console.warn("[loginUnified] bridge login failed (non-blocking)", e);
  }

  console.log("[loginUnified] popup done");
}



/* ==== Logout “en todos lados” (botón del Layout) ==== */
export async function logoutEverywhere(opts?: { hardReload?: boolean }) {
  try { await signOut(auth); } catch (_) {}

  // Limpia caches típicos de app (ajusta claves si usas otras)
  try {
    localStorage.removeItem('authUser');
    sessionStorage.removeItem('authUser');
  } catch (_) {}

  // Bridge logout (borra cookie SSO global)
  await ssoLogout();


  if (opts?.hardReload) window.location.href = '/';
}

/* ==== Observador de sesión ==== */
export function listenAuth(cb: (user: any) => void) {
    const unsub = onAuthStateChanged(auth, cb);

  // 🔥 IMPORTANT: sincroniza LOGOUT cross-dominio
  // Si el usuario cierra sesión en otro subdominio, el cookie del bridge se apaga,
  // pero Firebase en este origin puede seguir “logueado”. Entonces validamos /whoami y cerramos.
  let alive = true;
  const check = async () => {
    if (!alive) return;
    if (!auth.currentUser) return; // si ya no hay sesión, nada que hacer
    const who = await ssoWhoAmI();
    // Solo cerramos si alcanzamos al bridge y dice "no ok"
    if (who?.reached && !who?.ok && auth.currentUser) {
      console.log("[SSO] cookie OFF -> signOut(firebase) (foro)");
      try { await signOut(auth); } catch (_) {}
    }
  };

  const onFocus = () => { void check(); };
  const onVis = () => { if (!document.hidden) void check(); };
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);
  const timer = window.setInterval(() => { void check(); }, 30_000);

  return () => {
    alive = false;
    unsub();
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVis);
    window.clearInterval(timer);
  };
}

/* ==== Obtener sesión (con token) ==== */
export function getSession(): Promise<Session | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      auth.currentUser
        .getIdToken()
        .then((token) =>
          resolve({
            uid: auth.currentUser!.uid,
            email: auth.currentUser!.email,
            displayName: auth.currentUser!.displayName,
            photoURL: auth.currentUser!.photoURL,
            token,
          }),
        )
        .catch(() =>
          resolve({
            uid: auth.currentUser!.uid,
            email: auth.currentUser!.email,
            displayName: auth.currentUser!.displayName,
            photoURL: auth.currentUser!.photoURL,
          }),
        );
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      if (!u) return resolve(null);
      u.getIdToken()
        .then((token) =>
          resolve({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            token,
          }),
        )
        .catch(() =>
          resolve({
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
          }),
        );
    });
  });
}

/* ==== Requerir sesión (lanza si no hay) ==== */
export async function requireAuth(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error('AUTH_REQUIRED');
  return s;
}

/* ==== Requerir sesión (si no hay, abre login con Google) ==== */
export async function requireSession(): Promise<Session> {
  // 1) ¿Ya hay sesión?
  const now = await getSession();
  if (now) return now;

  // 2) Login (SSO si existe; si no, popup fallback)
  let cred: UserCredential;
  try {
    // loginUnified no regresa cred; pero el observer se actualiza.
    // Para mantener compatibilidad, hacemos: loginUnified + esperar a auth.currentUser
    await loginUnified();
    if (!auth.currentUser) throw new Error("AUTH_REQUIRED");
    cred = { user: auth.currentUser } as unknown as UserCredential;
  } catch {
    // popup cerrado/bloqueado o error de auth
    throw new Error("AUTH_REQUIRED_POPUP_BLOCKED");
  }

  // 3) Construye la sesión directo del resultado (sin esperar al observer)
  const u = cred.user;
  const token = await u.getIdToken();
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    token,
  };
}

export { auth };
