// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { watchTrendingThreads } from "@/services/forum";
import { watchIsFollowing } from "@/services/follow";
import type { Thread } from "@/types/forum";
import { auth } from "@/firebase";

import NowWidget from "@/components/NowWidget";
// import AuthBox from "@/components/AuthBox"; // si luego quieres reactivar el hero

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
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-slate-500 text-sm">
      Todavía no hay discusiones trending. Sé el primero en abrir un tema.
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  // UID del usuario autenticado (o null si no hay sesión)
  const [userId, setUserId] = useState<string | null>(null);

  // trending
  useEffect(() => {
    const off = watchTrendingThreads(
      (rows) => {
        setItems(rows);
        setLoading(false);
      },
      { pageSize: 12 }
    );
    return () => off();
  }, []);

  // Auth: quién está logueado
  useEffect(() => {
    const offAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => offAuth();
  }, []);

  return (
    <div className="space-y-6">
      {/* <AuthBox /> */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        {/* Columna principal: trending */}
        <div className="space-y-4">
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
              items.map((t) => {
                const threadId = String(
                  (t as any).id ?? (t as any).threadId ?? ""
                );
                return (
                  <PostCard
                    key={threadId}
                    t={t}
                    threadId={threadId}
                    currentUserId={userId}
                  />
                );
              })
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

        {/* Columna lateral: actividad en vivo */}
        <NowWidget
          title="Ahora mismo en la comunidad"
          take={3}
          linkAllHref="/feed"
        />
      </div>
    </div>
  );
}

type PostCardProps = {
  t: Thread;
  threadId: string;
  currentUserId: string | null;
};

function PostCard({ t, threadId, currentUserId }: PostCardProps) {
  const href = `/thread/${encodeURIComponent(threadId)}`;
  const title = (t as any).title ?? "Sin título";
  const letter = (title[0] || "U").toUpperCase();

  const replies = Number((t as any).repliesCount ?? 0);
  const views = Number((t as any).viewsCount ?? (t as any).views ?? 0);
  const upvotes = Number((t as any).upvotesCount ?? 0);
  const tags: string[] = (t as any).tags ?? [];

  const [isFollowing, setIsFollowing] = useState(false);

  // ⬇️ Aquí usamos el MISMO hook que ya funciona en FollowButton
  useEffect(() => {
    if (!currentUserId || !threadId) {
      setIsFollowing(false);
      return;
    }

    const off = watchIsFollowing(currentUserId, threadId, (v) => {
      setIsFollowing(!!v);
    });

    return () => off();
  }, [currentUserId, threadId]);

  return (
    <Link
      to={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white grid place-items-center text-sm font-bold">
          {letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
            {tags.slice(0, 4).map((tg) => (
              <span
                key={tg}
                className="rounded-full bg-slate-100 px-2 py-0.5"
              >
                #{tg}
              </span>
            ))}

            {isFollowing && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                ✓ Siguiendo
              </span>
            )}
          </div>

          <div className="font-semibold hover:underline truncate">{title}</div>
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
