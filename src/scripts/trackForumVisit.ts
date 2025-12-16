import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebase";

// Reusa la misma lista (o impórtala si la mueves a un archivo común)
const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

const DOC_PATH = { col: "visitCounts", id: "foroHome" };

// --- 1 visita por día por usuario (evita que suba al navegar/recargar el mismo día) ---
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // ej: 2025-12-16
}

function dailyKey(uid: string) {
  return `visitcount:foroHome:counted:${uid}:${todayKey()}`;
}

export function trackForumVisitOncePerDay() {
  const ref = doc(db, DOC_PATH.col, DOC_PATH.id);

  const off = onAuthStateChanged(auth, async (user) => {
    if (!user) return; // solo cuenta si está logueado

    const email = user.email ?? "";
    if (ADMIN_EMAILS.includes(email)) return; // excluye equipo/admins

    const key = dailyKey(user.uid);
    if (localStorage.getItem(key) === "1") return; // ya contó hoy

    // marcamos antes para evitar dobles clicks/montajes rápidos
    localStorage.setItem(key, "1");

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const prev = snap.exists() ? Number(snap.data()?.count ?? 0) : 0;
        if (!snap.exists()) tx.set(ref, { count: 1 });
        else tx.update(ref, { count: prev + 1 });
      });
    } catch (e) {
      // si falla, quitamos la marca para reintentar luego
      localStorage.removeItem(key);
      throw e;
    }
  });

  return off; // por si quieres limpiar
}

export function listenForumVisits(setter: (n: number) => void) {
  const ref = doc(db, DOC_PATH.col, DOC_PATH.id);
  return onSnapshot(ref, (snap) => {
    setter(Number(snap.data()?.count ?? 0));
  });
}
