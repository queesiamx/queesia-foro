// src/pages/Threads.tsx
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import type { Thread } from "@/types/forum";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate, Link, useParams } from "react-router-dom";
import { MessageSquare, Eye } from "lucide-react";
import ForumNavbar from "@/components/ForumNavbar";

// Ampliamos un poco el tipo para asegurarnos de tener autor
type ThreadWithAuthor = Thread & {
  authorId?: string;
  authorName?: string | null;
};

export default function Threads() {
  const navigate = useNavigate();

  const [items, setItems] = useState<ThreadWithAuthor[]>([]);
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
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
      setLoading(false);
    });

    return () => off();
  }, []);

  return (
       <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <ForumNavbar />

        <div className="pt-2">
                <Link
                  to="/"
                  className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  ← Volver
                </Link>
              </div>
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
            const letter = (t.authorName ?? "U")[0]?.toUpperCase() ?? "U";

            // Navegar al hilo completo
            const goThread = () => navigate(`/thread/${t.id}`);

            // Navegar al perfil del autor (sin disparar el click del card)
            const goAuthor = (e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              if (!t.authorId) return;
              navigate(`/u/${t.authorId}`);
            };

            return (
              <div
                key={t.id}
                onClick={goThread}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar del autor clicable */}
                  <button
                    type="button"
                    onClick={goAuthor}
                    className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-sm font-bold"
                  >
                    {letter}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Nombre del autor clicable */}
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {t.authorId ? (
                        <button
                          type="button"
                          onClick={goAuthor}
                          className="font-medium text-slate-800 hover:underline"
                        >
                          {t.authorName ?? "Usuario"}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {t.authorName ?? "Usuario"}
                        </span>
                      )}
                    </div>

                    {/* Título del hilo */}
                    <div className="font-semibold text-slate-900">
                      {t.title ?? "Sin título"}
                    </div>

                    {/* Métricas básicas */}
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
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  );
}
