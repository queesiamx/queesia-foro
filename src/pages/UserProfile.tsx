// src/pages/UserProfile.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { MessageSquare, Eye } from "lucide-react";

type TThread = {
  id: string;
  title?: string;
  createdAt?: Timestamp | Date;
  repliesCount?: number;
  viewsCount?: number;
  views?: number;
  tags?: string[];
  authorId?: string;
  authorName?: string;
};

type TPost = {
  id: string;
  threadId?: string;
  createdAt?: Timestamp | Date;
  authorId?: string;
};

const toDate = (d?: Date | Timestamp): Date | undefined =>
  d instanceof Timestamp ? d.toDate() : d instanceof Date ? d : undefined;

const fmt = (d?: Date) =>
  d
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "—";

export default function UserProfilePage() {
  const { uid } = useParams<{ uid: string }>();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<TThread[]>([]);
  const [posts, setPosts] = useState<TPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Quién soy yo (para saber si es "Mi perfil" o el de otra persona)
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => off();
  }, []);

  // Cargar hilos y posts de este usuario
  useEffect(() => {
    if (!uid || !db) return;

    setLoading(true);

    const qThreads = query(
      collection(db, "threads"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const qPosts = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const offThreads = onSnapshot(qThreads, (snap) => {
      setThreads(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TThread[]
      );
      setLoading(false);
    });

    const offPosts = onSnapshot(qPosts, (snap) => {
      setPosts(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TPost[]
      );
    });

    return () => {
      offThreads();
      offPosts();
    };
  }, [uid]);

  const isMe = currentUserId && uid === currentUserId;

  // Nombre del usuario: usamos el authorName de sus hilos más recientes
  const displayName = useMemo(() => {
    if (!threads.length) return isMe ? "Tú" : "Usuario";
    const withName = threads.find((t) => t.authorName);
    return withName?.authorName ?? (isMe ? "Tú" : "Usuario");
  }, [threads, isMe]);

  const initials = (displayName ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const threadsCount = threads.length;
  const postsCount = posts.length;

  // 🔹 Respuestas recientes ordenadas (tomamos las 5 más nuevas)
  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const da = toDate(a.createdAt)?.getTime() ?? 0;
        const db = toDate(b.createdAt)?.getTime() ?? 0;
        return db - da; // más recientes primero
      })
      .slice(0, 5);
  }, [posts]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header de perfil */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
              {isMe ? "Mi perfil" : displayName}
            </h1>
            <p className="text-sm text-slate-600">
              Participante en la comunidad de Quesia · Foro
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-slate-700">
          <div className="text-center">
            <div className="text-lg font-semibold">{threadsCount}</div>
            <div className="text-xs text-slate-500">Hilos creados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{postsCount}</div>
            <div className="text-xs text-slate-500">Respuestas</div>
          </div>
        </div>
      </div>

      {/* Lista de hilos recientes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Hilos recientes
        </h2>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            Cargando actividad…
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            {isMe
              ? "Todavía no has creado hilos en el foro."
              : "Esta persona aún no tiene hilos publicados."}
          </div>
        ) : (
          threads.map((t) => {
            const created = fmt(
              toDate(
                t.createdAt instanceof Timestamp
                  ? t.createdAt
                  : (t.createdAt as any)
              )
            );
            const repliesShown = t.repliesCount ?? 0;
            const viewsShown = t.viewsCount ?? t.views ?? 0;

            return (
              <Link
                key={t.id}
                to={`/thread/${t.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm md:text-base font-semibold text-slate-900">
                    {t.title ?? "Sin título"}
                  </h3>
                  <span className="text-xs text-slate-500">{created}</span>
                </div>

                {t.tags && t.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-600">
                    {t.tags.map((tg, i) => (
                      <span
                        key={`${tg}-${i}`}
                        className="rounded-full bg-slate-50 px-2 py-0.5 border border-slate-200"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> {repliesShown}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {viewsShown}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* 🔹 Nueva sección: Respuestas recientes */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Respuestas recientes
        </h2>

        {recentPosts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            {isMe
              ? "Todavía no has respondido en ningún hilo."
              : "Esta persona aún no ha respondido en otros hilos."}
          </div>
        ) : (
          <div className="space-y-2">
            {recentPosts.map((p) => {
              const created = fmt(
                toDate(
                  p.createdAt instanceof Timestamp
                    ? p.createdAt
                    : (p.createdAt as any)
                )
              );
              // Intentamos encontrar el título del hilo; si no, mostramos un genérico
              const thread = threads.find((t) => t.id === p.threadId);
              const title = thread?.title ?? "Ver hilo";

              return (
                <Link
                  key={p.id}
                  to={p.threadId ? `/thread/${p.threadId}` : "#"}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-slate-800">
                      Respuesta en:{" "}
                      <span className="font-semibold">{title}</span>
                    </span>
                    <span className="text-xs text-slate-500">{created}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="pt-2">
        <Link
          to="/feed"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← Volver al feed
        </Link>
      </div>
    </div>
  );
}
