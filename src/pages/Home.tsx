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

// 👇 Normalizador de estados derivados, igual que en ForumMock
type AnyThread = Thread & Record<string, any>;

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

  // 🔹 Datos del autor tomados del thread
  const any = t as any;
  const authorName: string =
    any.authorName ?? any.author?.name ?? "Usuario";
  const authorId: string | undefined =
    any.authorId ?? any.author?.id ?? undefined;

  // Letra del avatar: ahora viene del autor, no del título
  const letter = (authorName[0] || "U").toUpperCase();

  const title = any.title ?? "Sin título";

  const replies = Number(any.repliesCount ?? 0);
  const views = Number(any.viewsCount ?? any.views ?? 0);
  const upvotes = Number(any.upvotesCount ?? 0);
  const tags: string[] = any.tags ?? [];

  const [isFollowing, setIsFollowing] = useState(false);

  // estados derivados (Nuevo / Tendencia / Respondido)
  const { isNew, isTrending, isSolved } = deriveFlags(t as AnyThread);

  // ⬇️ Listener "¿yo sigo este hilo?"
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
        {/* Avatar: si hay authorId, lleva al perfil */}
        {authorId ? (
          <Link
            to={`/u/${authorId}`}
            onClick={(e) => e.stopPropagation()}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white grid place-items-center text-sm font-bold hover:brightness-105"
          >
            {letter}
          </Link>
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white grid place-items-center text-sm font-bold">
            {letter}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Chips de estado + tags */}
          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                Nuevo
              </span>
            )}

            {isTrending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                Tendencia
              </span>
            )}

            {isSolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Respondido
              </span>
            )}

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

          {/* Título del hilo */}
          <div className="font-semibold hover:underline truncate">
            {title}
          </div>

          {/* Autor (clicable si tiene perfil) + métricas */}
          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              👤
              {authorId ? (
                <Link
                  to={`/u/${authorId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {authorName}
                </Link>
              ) : (
                <span>{authorName}</span>
              )}
            </span>

            <span>💬 {replies}</span>
            <span>👁 {views}</span>
            <span>👍 {upvotes}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

