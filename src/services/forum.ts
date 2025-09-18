 // src/services/forum.ts
 import { db } from "@/firebase";
 import {
   collection,
   query,
   where,
   orderBy,
   limit,
   onSnapshot,
   Timestamp,
   getCountFromServer,
   type Firestore,
   type QuerySnapshot,
   type DocumentData,
 } from "firebase/firestore";
 import type { Thread } from "@/types/forum";

 // Forzamos a TS a tratarlo como no-nulo (si falla, fallará en runtime igual)
 const DB: Firestore = db as Firestore;

 // ---------- Helpers ----------
 export function computeTrendingScore(t: Thread) {
   const replies = t.repliesCount ?? 0;
   const up = t.upvotesCount ?? 0;
   const views = Number(t.viewsCount ?? 0);
   const created =
     (t.createdAt as Timestamp | undefined)?.toDate() ?? new Date(0);
   const hours = (Date.now() - created.getTime()) / 36e5;
   const freshness = Math.max(0, 48 - hours);
   return replies * 3 + up * 2 + views * 0.2 + freshness;
 }

 // ---------- Live queries ----------
 export function watchTrendingThreads(
   onData: (threads: Thread[]) => void,
   opts: { pageSize?: number } = {}
 ) {
   const pageSize = opts.pageSize ?? 10;

   // Intenta con trendingScore
    const q1 = query(
    collection(DB, "threads"),
    where("status", "in", ["published", "open"]),  // <—
    orderBy("trendingScore", "desc"),
    limit(pageSize)
  );

   // Fallback por fecha (y reordenamos en cliente)
  const q2 = query(
    collection(DB, "threads"),
    orderBy("lastActivityAt", "desc"),
    limit(pageSize * 2)
  );

   const handleQ2 = (snap2: QuerySnapshot<DocumentData>) => {
     let items: Thread[] = snap2.docs.map((d) => ({
       id: d.id,
       ...(d.data() as any),
     }));
     items = items
       .map((t) => ({ ...t, trendingScore: computeTrendingScore(t) }))
       .sort((a, b) => (b.trendingScore! - a.trendingScore!))
       .slice(0, pageSize);
     onData(items);
   };

   let unsubQ2: (() => void) | null = null;

   const unsubQ1 = onSnapshot(
   q1,
   (snap) => {
     if (!snap.empty) {
       const hasScore = snap.docs.some((d) => d.get("trendingScore") != null);
       if (!hasScore) {
         // Usa el fallback ordenado por lastActivityAt y reordena en cliente
         unsubQ2 = onSnapshot(q2, handleQ2);
         return;
       }
       const items: Thread[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
       onData(items);
     } else {
       unsubQ2 = onSnapshot(q2, handleQ2);
     }
   },
   (err) => {
     if ((err as any).code === "failed-precondition" || /index/i.test(String(err?.message))) {
       unsubQ2 = onSnapshot(q2, handleQ2);
     } else {
       console.error(err);
     }
   }
 );

   return () => {
     unsubQ1();
     if (unsubQ2) unsubQ2();
   };
 }
 
// ---------- Sidebar "Ahora mismo" (hilos recientes/activos) ----------
/**
+ * Devuelve una suscripción para poblar el widget lateral "Ahora mismo".
+ * Prioriza `lastActivityAt` (si lo tienes); cae a `updatedAt` y luego `createdAt`.
+ * Por defecto muestra 3 hilos con status publicados/abiertos.
+ */
export function watchSidebarNowThreads(
  onData: (threads: Thread[]) => void,
  opts: { take?: number; states?: string[] } = {}
) {
  const take = opts.take ?? 3;
  const states = opts.states ?? ["published", "open"];
  const col = collection(DB, "threads");

  const qBy = (field: "lastActivityAt" | "updatedAt" | "createdAt") =>
    query(
      col,
      where("status", "in", states),
      orderBy(field, "desc"),
      limit(take)
    );

  const q1 = qBy("lastActivityAt");
  const q2 = qBy("updatedAt");
  const q3 = qBy("createdAt");

  let unsub: (() => void) | null = null;

  const tryQ = (
    qA: ReturnType<typeof qBy>,
    next?: () => void
  ): (() => void) => {
    return onSnapshot(
      qA,
      (snap) => {
        if (!snap.empty) {
          const rows: Thread[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }));
          onData(rows);
        } else if (next) {
          unsub = tryQNext(next);
        } else {
          onData([]);
        }
      },
      // Si falta índice, cascada al siguiente orden
      () => {
        if (next) unsub = tryQNext(next);
        else onData([]);
      }
    );
  };

  const tryQNext = (next: () => void) => {
    next(); // avanza a la siguiente query
    return () => {}; // placeholder; el real se setea en cada onSnapshot
  };
  // Cadena: lastActivityAt -> updatedAt -> createdAt
  unsub = tryQ(q1, () => (unsub = tryQ(q2, () => (unsub = tryQ(q3)))));

  return () => unsub?.();
}

 // ---------- Aggregations rápidas ----------
 export async function getSidebarCounts() {
   const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
   const baseStatus = ["published", "open"];

   const totalQ = query(
     collection(DB, "threads"),
     where("status", "in", baseStatus)
   );
   const recientesQ = query(
     collection(DB, "threads"),
     where("status", "==", "published")
   );
   const preguntasQ = query(
     collection(DB, "threads"),
     where("status", "==", "published"),
     where("tags", "array-contains", "preguntas")
   );
   const tutorialesQ = query(
     collection(DB, "threads"),
     where("status", "==", "published"),
     where("tags", "array-contains", "tutorial")
   );

   const [all, rec, preg, tuto] = await Promise.all([
     getCountFromServer(totalQ),
     getCountFromServer(recientesQ),
     getCountFromServer(preguntasQ),
     getCountFromServer(tutorialesQ),
   ]);

   return {
     trending: all.data().count,
     recientes: rec.data().count,
     populares: Math.max(0, all.data().count - rec.data().count),
     preguntas: preg.data().count,
     tutoriales: tuto.data().count,
   };
 }
