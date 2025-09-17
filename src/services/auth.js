// src/services/auth.ts  — RTC-CO
// Único origen de Firebase en el cliente
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, } from 'firebase/auth';
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
/* ==== Login / Logout básicos ==== */
export function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}
export function logout() {
    return signOut(auth);
}
/* ==== Logout “en todos lados” (botón del Layout) ==== */
export async function logoutEverywhere(opts) {
    try {
        await signOut(auth);
    }
    catch (_) { }
    // Limpia caches típicos de app (ajusta claves si usas otras)
    try {
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authUser');
    }
    catch (_) { }
    // Si tienes un bridge de cookies/sesión en servidor, lo llamamos (opcional)
    const BRIDGE_URL = import.meta.env.VITE_AUTH_BRIDGE_URL;
    if (BRIDGE_URL) {
        try {
            await fetch(`${BRIDGE_URL}/logout`, { method: 'POST', credentials: 'include' });
        }
        catch (_) { }
    }
    if (opts?.hardReload) {
        window.location.href = '/';
    }
}
/* ==== Observador de sesión ==== */
export function listenAuth(cb) {
    return onAuthStateChanged(auth, cb);
}
/* ==== Obtener sesión (con token) ==== */
export function getSession() {
    return new Promise((resolve) => {
        if (auth.currentUser) {
            auth.currentUser
                .getIdToken()
                .then((token) => resolve({
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName,
                photoURL: auth.currentUser.photoURL,
                token,
            }))
                .catch(() => resolve({
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName,
                photoURL: auth.currentUser.photoURL,
            }));
            return;
        }
        const unsub = onAuthStateChanged(auth, (u) => {
            unsub();
            if (!u)
                return resolve(null);
            u.getIdToken()
                .then((token) => resolve({
                uid: u.uid,
                email: u.email,
                displayName: u.displayName,
                photoURL: u.photoURL,
                token,
            }))
                .catch(() => resolve({
                uid: u.uid,
                email: u.email,
                displayName: u.displayName,
                photoURL: u.photoURL,
            }));
        });
    });
}
/* ==== Requerir sesión (lanza si no hay) ==== */
export async function requireAuth() {
    const s = await getSession();
    if (!s)
        throw new Error('AUTH_REQUIRED');
    return s;
}
/* ==== Requerir sesión (si no hay, abre login con Google) ==== */
export async function requireSession() {
    // 1) intenta sesión actual
    const s1 = await getSession();
    if (s1)
        return s1;
    // 2) si no hay, dispara popup de Google
    try {
        await loginWithGoogle(); // devuelve UserCredential, pero no lo usamos aquí
    }
    catch (err) {
        // Popup cancelado/bloqueado o error de auth
        throw new Error('AUTH_REQUIRED_POPUP_BLOCKED');
    }
    // 3) vuelve a leer la sesión ya autenticada
    const s2 = await getSession();
    if (!s2)
        throw new Error('AUTH_REQUIRED');
    return s2;
}
export { auth };
