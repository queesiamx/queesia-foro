import { useEffect, useState } from "react";
import type { Thread } from "@/types/forum";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { MessageSquare, Eye } from "lucide-react";  // 👈 ESTA LÍNEA

export default function Threads() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore();
    const q = query(
      collection(db, "threads"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const off = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
      setLoading(false);
    });
    return () => off();
  }, []);

  return (
    <div className="space-y-4">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse"
            />
          ))
        : items.map((t) => {
            const repliesShown = t.repliesCount ?? 0;
            const viewsShown = t.viewsCount ?? (t as any).views ?? 0;

            return (
              <Link
                key={t.id}
                to={`/thread/${t.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
              >
                <div className="font-semibold text-slate-900">
                  {t.title ?? "Sin título"}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {repliesShown}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {viewsShown}
                  </span>
                </div>
              </Link>
            );
          })}
    </div>
  );
}