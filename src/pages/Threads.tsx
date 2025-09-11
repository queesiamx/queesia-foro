import { useEffect, useState } from "react";
import type { Thread } from "@/types/forum";
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function Threads() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, "threads"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const off = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    return () => off();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse" />
        ))
      ) : (
        items.map((t) => (
          <a key={t.id} href={`/thread/${t.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300">
            <div className="font-semibold">{t.title}</div>
          </a>
        ))
      )}
    </div>
  );
}
