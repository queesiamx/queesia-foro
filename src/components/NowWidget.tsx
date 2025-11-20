// src/components/NowWidget.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Thread } from "@/types/forum";
import { watchTrendingThreads } from "@/services/forum";
import { MessageCircle, Eye, Flame, CheckCircle2 } from "lucide-react";

type Props = {
  title?: string;
  take?: number;
  linkAllHref?: string; // ruta al listado completo
};

type AnyThread = Thread & Record<string, any>;

// 👇 Mismo cálculo de estados que en ForumMock/Home
function deriveFlags(t: AnyThread) {
  const any = t as AnyThread;
  const created = any.createdAt;
  const lastAct = any.lastActivityAt ?? any.updatedAt ?? created;

  const toDate = (v: any) =>
    v?.toDate?.() ??
    (v instanceof Date ? v : v ? new Date(v) : new Date());

  const createdDate = toDate(created);
  const lastDate = toDate(lastAct);
  const now = new Date();

  const hoursSinceCreated =
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  const hoursSinceLast =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

  const replies = Number(any.repliesCount ?? any.commentsCount ?? 0);
  const views = Number(any.viewsCount ?? any.views ?? 0);

  // normalizamos el status a string genérico
  const status = String(any.status ?? "").toLowerCase();

  const isSolved =
    Boolean(any.bestPostId) ||
    status === "resolved" ||   // ahora compara contra un string normal
    !!any.resolved;


  const isNew = hoursSinceCreated <= 24;
  const isTrending =
    (replies >= 3 && hoursSinceLast <= 24) ||
    (views >= 30 && hoursSinceLast <= 24);

  return { isNew, isTrending, isSolved };
}

export default function NowWidget({
  title = "Ahora mismo en la comunidad",
  take = 3,
  linkAllHref = "/feed",
}: Props) {
  const [items, setItems] = useState<Thread[] | null>(null);

  useEffect(() => {
    // Usamos el mismo origen que el listado principal,
    // pero recortamos a `take` resultados.
    const off = watchTrendingThreads(
      (rows) => {
        setItems(rows.slice(0, take));
      },
      { pageSize: take }
    );
    return off;
  }, [take]);

  const isLoading = items === null;
  const hasItems = !!items && items.length > 0;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <Flame className="h-4 w-4 text-amber-500" />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: take }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && !hasItems && (
        <p className="text-xs text-slate-500">
          Aún no hay actividad reciente.
        </p>
      )}

      {hasItems && (
        <ul className="space-y-2">
          {(items as AnyThread[]).map((t) => {
            const id = t.id ?? (t as any).id;
            const title = t.title ?? "Sin título";
            const replies = Number(t.repliesCount ?? 0);
            const views = Number(t.viewsCount ?? (t as any).views ?? 0);

            const { isNew, isTrending, isSolved } = deriveFlags(t);

            return (
              <li key={id}>
                <Link
                  to={`/thread/${encodeURIComponent(String(id))}`}
                  className="block rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  {/* mini-chips de estado */}
                  <div className="mb-0.5 flex items-center gap-1 text-[10px]">
                    {isNew && (
                      <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-sky-700">
                        Nuevo
                      </span>
                    )}
                    {isTrending && (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-rose-700">
                        Tendencia
                      </span>
                    )}
                    {isSolved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Resp.
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-medium text-slate-900 line-clamp-2">
                    {title}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {replies}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {views}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-1">
        <Link
          to={linkAllHref}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline"
        >
          Ver todos los temas →
        </Link>
      </div>
    </aside>
  );
}
