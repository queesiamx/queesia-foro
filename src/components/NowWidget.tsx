// src/components/NowWidget.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchSidebarNowThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";
import { MessageCircle, Eye, Flame } from "lucide-react";

type Props = {
  title?: string;
  take?: number;
  linkAllHref?: string; // ruta al listado completo
};

type AnyThread = Thread & Record<string, any>;

export default function NowWidget({
  title = "Ahora mismo en la comunidad",
  take = 5,
  linkAllHref = "/feed", // #RTC_CO — tu listado vive en /feed
}: Props) {
  const [items, setItems] = useState<Thread[] | null>(null);

  useEffect(() => {
    // ✅ la función devuelve el unsubscribe directamente
    const off = watchSidebarNowThreads(setItems, { take });
    return off;
  }, [take]);

  return (
    <aside className="rounded-xl border bg-white">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      <div className="p-2 space-y-2">
        {items === null ? (
          // Skeletons
          Array.from({ length: take }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-3">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="mt-2 flex gap-3">
                <div className="h-3 w-8 bg-gray-200 rounded" />
                <div className="h-3 w-8 bg-gray-200 rounded" />
                <div className="h-3 w-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500 p-3">
            Aún no hay actividad reciente.
          </div>
        ) : (
          items.map((raw) => {
            const t = raw as AnyThread;
            const title = String(t.title ?? "Sin título");
            const replies = Number(t.repliesCount ?? t.commentsCount ?? 0);
            // #RTC_CO — vistas con fallback al campo viejo
            const views = Number(t.viewsCount ?? t.views ?? 0);
            const likes = Number(t.upvotesCount ?? t.likesCount ?? 0);

            return (
              <Link
                to={`/t/${t.id}`} // ajusta si tu detalle usa otra ruta 
                key={t.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle size={14} />
                      {replies}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={14} />
                      {views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Flame size={14} />
                      {likes}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <Link
          to={linkAllHref}
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          Ver todos los temas →
        </Link>
      </div>
    </aside>
  );
}
