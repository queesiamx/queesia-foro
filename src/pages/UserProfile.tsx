// src/pages/UserProfile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Eye, MessageSquare } from "lucide-react";

type ThreadLite = {
  id: string;
  title?: string;
  tags?: string[];
  viewsCount?: number;
  repliesCount?: number;
  createdAt?: Timestamp;
  lastActivityAt?: Timestamp;
};

type PostLite = {
  id: string;
  threadId: string;
  threadTitle?: string;
  createdAt?: Timestamp;
  upvotes?: number;
};

type UserDoc = {
  displayName?: string;
  bio?: string;
};

type Stats = {
  threadsCount: number;
  repliesCount: number;
  totalViews: number;
  totalUpvotes: number;
  acceptedAnswers: number;
};

const emptyStats: Stats = {
  threadsCount: 0,
  repliesCount: 0,
  totalViews: 0,
  totalUpvotes: 0,
  acceptedAnswers: 0,
};

const toDate = (d?: Timestamp) => (d instanceof Timestamp ? d.toDate() : undefined);

const fmtShort = (d?: Date) =>
  d
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "";

export default function UserProfile() {
  const { uid } = useParams<{ uid: string }>();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);

  const [threads, setThreads] = useState<ThreadLite[]>([]);
  const [replies, setReplies] = useState<PostLite[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);


  // Nombre público derivado de hilos / posts (para cuando las reglas no
  // permiten leer /users/{uid} de otros usuarios)
  const [fallbackDisplayName, setFallbackDisplayName] = useState<string | null>(null);


  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);

  // Usuario logueado
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => off();
  }, []);

  // Datos del usuario (bio, nombre público) desde /users/{uid}
  useEffect(() => {
    if (!uid || !db) return;

    const ref = doc(db, "users", uid);
    const off = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
        } else {
          setUserDoc(null);
        }
      },
      () => {
        setUserDoc(null);
      }
    );

    return () => off();
  }, [uid]);

  // Hilos recientes + stats (vistas e hilos)
  useEffect(() => {
    if (!uid || !db) return;
    setLoadingThreads(true);

    const qThreads = query(
      collection(db, "threads"),
      where("authorId", "==", uid),
      orderBy("lastActivityAt", "desc"),
      limit(5)
    );

    const off = onSnapshot(
      qThreads,
      (snap) => {
        const items: ThreadLite[] = [];
        let totalViews = 0;
        // Intentamos obtener un nombre público desde los hilos
        let nameFromThreads: string | null = null;

        snap.forEach((d) => {
          const data = d.data() as any;

          if (!nameFromThreads) {
            // Usa aquí el campo que realmente tengas en tus hilos
            // (ajusta los nombres si tu esquema es distinto).
            nameFromThreads =
              data.authorName ??
              data.authorDisplayName ??
              data.author?.displayName ??
              null;
          }

          items.push({
            id: d.id,
            title: data.title,
            tags: data.tags ?? [],
            viewsCount: data.viewsCount ?? data.views ?? 0,
            repliesCount: data.repliesCount ?? 0,
            createdAt: data.createdAt,
            lastActivityAt: data.lastActivityAt,
          });
          const v = typeof data.viewsCount === "number" ? data.viewsCount : data.views ?? 0;
          totalViews += v;
        });

        // Solo pisamos el fallback si encontramos algo
        if (nameFromThreads) {
          setFallbackDisplayName((prev) => prev ?? nameFromThreads!);
        }

        setThreads(items);
        setStats((prev) => ({
          ...prev,
          threadsCount: snap.size,
          totalViews,
        }));
        setLoadingThreads(false);
      },
      () => {
        setThreads([]);
        setStats((prev) => ({ ...prev, threadsCount: 0, totalViews: 0 }));
        setLoadingThreads(false);
      }
    );

    return () => off();
  }, [uid]);

  // Respuestas recientes + stats (respuestas y votos)
  useEffect(() => {
    if (!uid || !db) return;
    setLoadingReplies(true);

    const qPosts = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const off = onSnapshot(
      qPosts,
      (snap) => {
        const items: PostLite[] = [];
        let totalUpvotes = 0;

        snap.forEach((d) => {
          const data = d.data() as any;
          items.push({
            id: d.id,
            threadId: data.threadId,
            threadTitle: data.threadTitle, // opcional si luego lo agregas
            createdAt: data.createdAt,
            upvotes: data.upvotes ?? 0,
          });
          const u = typeof data.upvotes === "number" ? data.upvotes : 0;
          totalUpvotes += u;
        });

        setReplies(items);
        setStats((prev) => ({
          ...prev,
          repliesCount: snap.size,
          totalUpvotes,
          // acceptedAnswers quedará en 0 por ahora;
          // luego lo conectamos cuando marquemos isAnswer en los posts.
          acceptedAnswers: prev.acceptedAnswers,
        }));
        setLoadingReplies(false);
      },
      () => {
        setReplies([]);
        setStats((prev) => ({
          ...prev,
          repliesCount: 0,
          totalUpvotes: 0,
        }));
        setLoadingReplies(false);
      }
    );

    return () => off();
  }, [uid]);

  // Reputación suave (puede ajustarse después)
  const reputation = useMemo(() => {
    const base =
      stats.threadsCount * 5 +
      stats.repliesCount * 10 +
      stats.totalUpvotes * 1 +
      stats.acceptedAnswers * 15;
    return base;
  }, [stats]);

  const isMe = currentUser && uid && currentUser.uid === uid;

    const displayName = useMemo(
    () =>
      userDoc?.displayName ??
      (isMe
        ? currentUser?.displayName ?? currentUser?.email ?? "Tú"
        : fallbackDisplayName ?? "Usuario"),
    [userDoc, isMe, currentUser, fallbackDisplayName]
  );

  const bioText = userDoc?.bio?.trim();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Encabezado */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-xl font-bold">
            {displayName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900">
              {displayName}
            </h1>
            <p className="text-xs text-slate-500">
              Participante en la comunidad de Quesia · Foro
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-600">
          <p>
            <span className="font-semibold">{stats.threadsCount}</span> Hilos creados
          </p>
          <p>
            <span className="font-semibold">{stats.repliesCount}</span> Respuestas
          </p>
          <p>
            <span className="font-semibold">{reputation}</span> Reputación
          </p>
        </div>
      </section>

      {/* Acerca de mí */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Acerca de mí</h2>
        {bioText ? (
          <p className="text-sm text-slate-700 whitespace-pre-line">{bioText}</p>
        ) : (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has agregado una descripción pública. Pronto podremos editarla desde tu perfil."
              : "Esta persona aún no ha agregado una descripción pública."}
          </p>
        )}
      </section>

      {/* Stats del usuario */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Stats del usuario</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.totalViews}
            </div>
            <div className="text-slate-500">Vistas generadas en sus hilos</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.totalUpvotes}
            </div>
            <div className="text-slate-500">Votos recibidos en sus respuestas</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.acceptedAnswers}
            </div>
            <div className="text-slate-500">
              Respuestas marcadas como “mejor respuesta”
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">{reputation}</div>
            <div className="text-slate-500">Reputación acumulada</div>
          </div>
        </div>
      </section>

      {/* Hilos recientes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Hilos recientes</h2>
        </div>

        {loadingThreads ? (
          <p className="text-sm text-slate-500">Cargando actividad…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has creado hilos en el foro."
              : "Esta persona aún no ha creado hilos en el foro."}
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {threads.map((t) => {
              const created = toDate(t.createdAt) ?? toDate(t.lastActivityAt);
              return (
                <li
                  key={t.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 flex flex-col gap-1"
                >
                  <Link
                    to={`/thread/${t.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {t.title ?? "Sin título"}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {created && <span>{fmtShort(created)}</span>}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {t.repliesCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {t.viewsCount ?? 0}
                    </span>
                    {(t.tags ?? []).slice(0, 3).map((tag, idx) => (
                      <span
                        key={`${t.id}-${idx}`}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Respuestas recientes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Respuestas recientes</h2>
        </div>

        {loadingReplies ? (
          <p className="text-sm text-slate-500">Cargando actividad…</p>
        ) : replies.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has respondido en otros hilos."
              : "Esta persona aún no ha respondido en otros hilos."}
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {replies.map((r) => {
              const created = toDate(r.createdAt);
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 flex flex-col gap-1"
                >
                  <Link
                    to={`/thread/${r.threadId}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {r.threadTitle ?? "Respuesta en un hilo"}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {created && <span>{fmtShort(created)}</span>}
                    <span>{r.upvotes ?? 0} votos</span>
                  </div>
                </li>
              );
            })}
          </ul>
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
