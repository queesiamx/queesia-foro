import { useEffect, useState } from "react";
import { watchTrendingThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";
import { Link } from "react-router-dom";  // <-- usa Link

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse"
        />
      ))}
    </>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
      Aún no hay discusiones trending.
    </div>
  );
}


export default function Home() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = watchTrendingThreads((rows) => {
       setItems(rows);
       setLoading(false);
     }, { pageSize: 12 });
     return () => off();
   }, []);

  return (
    <div className="space-y-4">
      {/* ...Hero igual que ya tenías... */}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Discusiones Trending</h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
          {items.length} nuevas
        </span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <Empty />
        ) : (
          items.map((t) => <PostCard key={t.id} t={t} />)
        )}
      </div>

      <div className="pt-2">
        <Link
          to="/feed"
          className="mx-auto block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 text-center"
        >
          Ver todos los temas
        </Link>
      </div>
    </div>
  );
}

function PostCard({ t }: { t: Thread }) {
  const letter = (t.title?.[0] || "U").toUpperCase();

    // Normaliza nombres de campos sin cambiar el tipo global
  const replies = (t as any).repliesCount ?? 0;
  const views   = (t as any).views ?? (t as any).viewsCount ?? 0;
  const upvotes = (t as any).upvotesCount ?? 0;


    return (
    <Link
      to={`/thread/${t.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 text-white grid place-items-center text-sm font-bold">
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1">
            {(t.tags ?? []).slice(0, 4).map((tg) => (
              <span key={tg} className="rounded-full bg-slate-100 px-2 py-0.5">#{tg}</span>
            ))}
          </div>
          <div className="font-semibold hover:underline truncate">{t.title}</div>
          <div className="mt-1 flex items-center gap-4 text-xs text-slate-600">
            <span>💬 {replies}</span>
            <span>👁 {views}</span>
            <span>👍 {upvotes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}