// src/pages/Thread.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "@/firebase";
import { getSession } from "@/services/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  MessageSquare,
  Eye,
  Bookmark,
  CheckCircle2,
  ThumbsUp,
} from "lucide-react";

/* ----------------------------- Tipos locales ----------------------------- */
type TThread = {
  id: string;
  title?: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
  locked?: boolean;
  repliesCount?: number;
  views?: number;
  viewsCount?: number; // por si tu doc usa este nombre
};

type TPost = {
  id: string;
  body: string;
  authorName?: string;
  createdAt?: Timestamp | Date;
  isAnswer?: boolean;
  upvotes?: number;
};

/* ---------------------------- Utilidades UI/UX --------------------------- */
const toDate = (d?: Date | Timestamp): Date | undefined =>
  d instanceof Timestamp ? d.toDate() : d instanceof Date ? d : undefined;

const fmt = (d?: Date) =>
  d
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "—";

/** Render súper ligero de “markdown” (negritas, itálicas, code, saltos de línea) */
function mdLight(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

/* --------------------------------- Página -------------------------------- */
export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<TThread | null>(null);
  const [posts, setPosts] = useState<TPost[]>([]);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  // Suscripciones en vivo
  useEffect(() => {
    if (!id || !db) return;

    // 1) Hilo
    const offThread = onSnapshot(doc(db, "threads", id), (snap) => {
      setThread(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null);
    });

    // 2) Respuestas del hilo
    const q = query(
      collection(db, "posts"),
      where("threadId", "==", id),
      orderBy("createdAt", "asc")
    );
    const offPosts = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TPost[]
      );
    });

    return () => {
      offThread();
      offPosts();
    };
  }, [id]);

  // Enviar respuesta
// Enviar respuesta
const onReply = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!db || !id || !reply.trim()) return;

  try {
    setSaving(true);

    // ← obtiene la sesión para guardar autor
    const { user } = await getSession();

    await addDoc(collection(db, "posts"), {
      threadId: id,
      body: reply.trim(),
      createdAt: serverTimestamp(),
      authorId: user?.uid ?? null,
      authorName: user?.displayName ?? user?.email ?? "Anónimo",
      // opcional: guarda el avatar si lo quieres mostrar luego
      // authorPhotoUrl: user?.photoURL ?? null,
    });

    setReply("");
  } finally {
    setSaving(false);
  }
};


  if (thread === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Hilo no encontrado.
        </div>
      </div>
    );
  }

  const repliesShown = thread.repliesCount ?? posts.length;
  const viewsShown = thread.views ?? thread.viewsCount ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header del hilo */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        {/* Chips / estados */}
        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
          {(thread.tags ?? []).map((tg) => (
            <span
              key={tg}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700"
            >
              #{tg}
            </span>
          ))}
          {thread.pinned && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
              📌 Fijado
            </span>
          )}
          {thread.locked && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
              🔒 Cerrado
            </span>
          )}
        </div>

        {/* Título y descripción */}
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
          {thread?.title ?? "Sin título"}
        </h1>
        {thread?.body && (
          <p
            className="mt-3 text-[15px] leading-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: mdLight(thread.body) }}
          />
        )}

        {/* Métricas / acciones */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {repliesShown}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {viewsShown}
          </span>
          <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
            <Bookmark className="h-3.5 w-3.5" /> Guardar
          </button>
          <Link to="/feed" className="hover:underline">
            ← Volver al feed
          </Link>
        </div>
      </header>

      {/* Respuestas */}
      <section className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
            Aún no hay respuestas.
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} p={p} />)
        )}
      </section>

      {/* Editor de respuesta */}
      <form
        onSubmit={onReply}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <label className="mb-2 block text-sm font-medium text-slate-800">
          Escribe una respuesta
        </label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          rows={5}
          placeholder="Comparte tu solución, código y contexto…"
          disabled={thread.locked}
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={saving || thread.locked || !reply.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Enviando…" : "Responder"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* --------------------------- Subcomponentes UI --------------------------- */

function PostCard({ p }: { p: TPost }) {
  const when = useMemo(() => fmt(toDate(p.createdAt)), [p.createdAt]);
  const letter = (p.authorName ?? "U")[0]?.toUpperCase();

  return (
    <article
      className={`rounded-2xl border bg-white p-4 ${
        p.isAnswer ? "border-emerald-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-sm font-bold">
          {letter}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-medium text-slate-800">
              {p.authorName ?? "Usuario"}
            </span>
            <span className="text-slate-400">•</span>
            <span>{when}</span>
            {p.isAnswer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Respuesta aceptada
              </span>
            )}
          </div>

          <div
            className="prose prose-slate max-w-none text-sm leading-6"
            // Si no usas @tailwindcss/typography, igual se ve bien.
            dangerouslySetInnerHTML={{ __html: mdLight(p.body) }}
          />

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <button className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-slate-50">
              <ThumbsUp className="h-3.5 w-3.5" /> {(p.upvotes ?? 0).toString()}
            </button>
            <button className="rounded-lg border px-2 py-1 hover:bg-slate-50">
              Responder
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
