// src/pages/Thread.tsx
import React, { useRef, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "@/firebase";
import { requireSession } from "@/services/auth";
import {
  doc, updateDoc, increment,
  onSnapshot, collection, query, where, orderBy, addDoc,
  getDocs,      // 👈 nuevo
  deleteDoc,    // 👈 nuevoserverTimestamp,
  serverTimestamp,Timestamp,
} from "firebase/firestore";

import { MessageSquare, Eye, Bookmark, CheckCircle2, ThumbsUp } from "lucide-react";
// #RTC_CO — F1.2 seguir hilo (sin AuthContext)
import { toggleFollow, watchFollowCount } from "@/services/follow";

import { renderSafe } from "@/utils/safeRender";
/* ----------------------------- Tipos locales ----------------------------- */
type TThread = {
  id: string;
  authorId?: string; // #RTC_CO — autor del hilo (para permisos de "Mejor respuesta")
  title?: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
  locked?: boolean;
  repliesCount?: number;
  views?: number;
  viewsCount?: number; // por si tu doc usa este nombre
  // #RTC_CO — F1.3: mejor respuesta
  bestPostId?: string;

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

//(Se reemplaza mdLight por renderSafe que usa marked + DOMPurify)

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

// 🔹 Sumar view una sola vez por sesión de navegador
useEffect(() => {
  if (!thread?.id || !db) return;

  // clave única por hilo
  const key = `thread-viewed-${thread.id}`;

  // window solo existe en el cliente
  if (typeof window !== "undefined") {
    // si ya contamos esta vista en esta sesión, no vuelvas a sumar
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }

  const ref = doc(db, "threads", thread.id);
  updateDoc(ref, {
    viewsCount: increment(1),
    lastViewAt: serverTimestamp(),
  }).catch(() => {});
}, [thread?.id]);



  // Enviar respuesta
// Enviar respuesta
const onReply = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!db || !id || !reply.trim()) return;

  try {
    setSaving(true);

   // ← obtiene la sesión para guardar autor (getSession() devuelve Session, no { user })
    const s = await requireSession();

    await addDoc(collection(db, "posts"), {
      threadId: id,
      body: reply.trim(),
      createdAt: serverTimestamp(),
      authorId: s.uid,
      authorName: s.displayName ?? s.email ?? "Anónimo",
      // opcional: guarda el avatar si lo quieres mostrar luego
      // authorPhotoUrl: user?.photoURL ?? null,
    });

      // 🔹 Suma el contador de respuestas en el hilo (sin backend)
    const threadRef = doc(db, "threads", id);
    updateDoc(threadRef, {
      repliesCount: increment(1),
      lastActivityAt: serverTimestamp(),
    }).catch(() => {});   

    setReply("");
  } finally {
    setSaving(false);
  }
};


  // #RTC_CO — F1.3: sube la mejor respuesta al inicio
// IMPORTANT: este hook debe llamarse SIEMPRE (sin returns tempranos antes)
const orderedPosts = useMemo(() => {
  if (!thread?.bestPostId || !posts.length) return posts;
  const best = posts.find((p) => p.id === thread.bestPostId);
  const rest = posts.filter((p) => p.id !== thread.bestPostId);
  return best ? [best, ...rest] : posts;
}, [posts, thread?.bestPostId]);

const repliesShown = (thread?.repliesCount ?? posts.length);
const viewsShown = (thread?.viewsCount ?? thread?.views ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Si no existe el hilo, muestra aviso y no intentes pintar su contenido */}
      {thread === null ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Hilo no encontrado.
        </div>
      ) : (
        <>
        {/* Header del hilo */}
        <header className="rounded-2xl border border-slate-200 bg-white p-5">
        {/* Chips / estados */}
        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
           {(thread.tags ?? []).map((tg, i) => (
             <span key={`${tg}-${i}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
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
          
          <div className="prose max-w-none" dangerouslySetInnerHTML={renderSafe(thread.body)} />
        )}


        {/* Métricas / acciones */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {repliesShown}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {viewsShown}
          </span>
          {/* #RTC_CO — F1.2: botón Seguir */}
          {thread?.id && <FollowButton threadId={thread.id} />}
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
          orderedPosts.map((p) => <PostCard key={p.id} p={p} thread={thread!} />)
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
          disabled={thread?.locked}
        />
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={saving || thread?.locked || !reply.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Enviando…" : "Responder"}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}

/* --------------------------- Subcomponentes UI --------------------------- */

// #RTC_CO — F1.2: componente FollowButton (sin AuthContext)
function FollowButton({ threadId }: { threadId: string }) {
  const [count, setCount] = useState(0);
  const [following, setFollowing] = useState(false);

  // contador en vivo
  useEffect(() => {
    if (!threadId) return;
    const off = watchFollowCount(threadId, setCount);
    return () => off();
  }, [threadId]);

  const onClick = async () => {
    try {
      // obliga a iniciar sesión solo al intentar seguir
      const s = await requireSession(); // devuelve { uid, displayName, email, ... }
      const res = await toggleFollow(s.uid, threadId);
      setFollowing(res.following);
    } catch {
      // si el usuario cancela login, simplemente no cambia UI
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 ${
        following ? "bg-violet-600 text-white" : "hover:bg-slate-50"
      }`}
      title={following ? "Dejar de seguir" : "Seguir hilo"}
    >
      {following ? "Siguiendo" : "Seguir"} · {count}
    </button>
  );
}

function PostCard({ p, thread }: { p: TPost; thread: TThread }) {
  const when = useMemo(() => fmt(toDate(p.createdAt)), [p.createdAt]);
  const letter = (p.authorName ?? "U")[0]?.toUpperCase();

  const isBest = thread?.bestPostId === p.id;

  // 👍 Like / Unlike
  const [liking, setLiking] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    try {
      setLiking(true);
      const s = await requireSession(); // pide login si no lo hay

      // 1) ¿Ya existe voto de este usuario para este post?
      const votesCol = collection(db, "post_votes");
      const q = query(
        votesCol,
        where("postId", "==", p.id),
        where("userId", "==", s.uid)
      );
      const snap = await getDocs(q);

      const postRef = doc(db, "posts", p.id);

      if (!snap.empty) {
        // Ya había voto → quitarlo
        await Promise.all([
          deleteDoc(snap.docs[0].ref),
          updateDoc(postRef, { upvotes: increment(-1) }),
        ]);
      } else {
        // No había voto → crearlo
        await Promise.all([
          addDoc(votesCol, {
            postId: p.id,
            userId: s.uid,
            createdAt: serverTimestamp(),
          }),
          updateDoc(postRef, { upvotes: increment(1) }),
        ]);
      }
      // El contador se actualiza solo por el onSnapshot de posts
    } catch (err) {
      console.error("Error al hacer like:", err);
    } finally {
      setLiking(false);
    }
  };

  // #RTC_CO — F1.3: marcar / desmarcar mejor respuesta
  const toggleBest = async () => {
    try {
      const s = await requireSession(); // pide login si no lo hay
      if (!thread?.id) return;
      if (thread?.authorId && s.uid !== thread.authorId) {
        // no eres el autor del hilo
        return;
      }
      await updateDoc(doc(db, "threads", thread.id), {
        bestPostId: isBest ? null : p.id,
      });
    } catch {
      // usuario canceló login o error silencioso
    }
  };

  return (
    <article
      className={`rounded-2xl bg-white p-4 border ${
        isBest ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
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
            {isBest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Respuesta aceptada
              </span>
            )}
          </div>

          <div
            className="prose prose-slate max-w-none text-sm leading-6"
            dangerouslySetInnerHTML={renderSafe(p.body)}
          />

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            {/* 👍 Like */}
            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
            >
              <ThumbsUp className="h-3.5 w-3.5" /> {(p.upvotes ?? 0).toString()}
            </button>

            {/* Responder (luego lo mejoramos si quieres) */}
            <button className="rounded-lg border px-2 py-1 hover:bg-slate-50">
              Responder
            </button>
         {/* #RTC_CO — F1.3: botón visible, lógica valida autor al hacer click */}
              <button
                onClick={toggleBest}
                className={`rounded-lg border px-2 py-1 ${
                  isBest ? "bg-emerald-600 text-white hover:bg-emerald-700" : "hover:bg-slate-50"
                }`}
                title="Solo el autor del hilo puede marcar la mejor respuesta"
              >
                {isBest ? "Quitar mejor respuesta" : "Marcar mejor respuesta"}
              </button>
          </div>
        </div>
      </div>
    </article>
  );
}
