import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchTrendingThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";

export default function TrendingReal({
  title = "Discusiones Trending",
  pageSize = 3,
}: { title?: string; pageSize?: number }) {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = watchTrendingThreads((rows) => {
      setItems(rows);
      setLoading(false);
    }, { pageSize });
    return () => off();
  }, [pageSize]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b">
        <div className="font-semibold">{title}</div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="h-[82px] rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-600">Aún no hay discusiones.</div>
        ) : (
          items.map((t) => <ThreadRow key={t.id} t={t} />)
        )}
      </div>

      <div className="border-t px-5 py-3 text-center">
        <Link to="/feed" className="text-sm font-medium text-violet-600 hover:underline">
          Ver todos los temas →
        </Link>
      </div>
    </div>
  );
}

function ThreadRow({ t }: { t: Thread }) {
  const letter = (t.title?.[0] || "U").toUpperCase();
  const replies = (t as any).repliesCount ?? 0;
  const views   = (t as any).views ?? (t as any).viewsCount ?? 0;
  const upvotes = (t as any).upvotesCount ?? 0;

  return (
    <Link
      to={`/thread/${t.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 text-white grid place-items-center text-xs font-bold">
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{t.title}</div>
          <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-600">
            <span>💬 {replies}</span>
            <span>👁 {views}</span>
            <span>👍 {upvotes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
