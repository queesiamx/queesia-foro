import { useEffect, useState } from "react";
import { watchTrendingThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";

export default function Home() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);



  return (
    <div className="space-y-4">
      {/* Hero Trending */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="q-gradient px-5 py-4 text-white">
          <div className="text-sm opacity-90">🔥 Trending en la Comunidad</div>
          <div className="text-lg font-semibold">Descubre las conversaciones más populares sobre IA</div>
        </div>
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Miembros activos" value="—" />
          <Stat label="Discusiones hoy" value="—" />
          <Stat label="Visitas" value="—" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Discusiones Trending</h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
          {items.length} nuevas
        </span>
      </div>

      {/* Lista */}
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
        <button className="mx-auto block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Cargar más discusiones
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse" />
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

function PostCard({ t }: { t: Thread }) {
  const letter = (t.title?.[0] || "U").toUpperCase();
  return (
    <a href={`/thread/${t.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300">
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
            <span>💬 {t.repliesCount ?? 0}</span>
            <span>👁 {t.viewsCount ?? 0}</span>
            <span>👍 {t.upvotesCount ?? 0}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
