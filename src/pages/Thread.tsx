// src/pages/Thread.tsx
import React, { useRef, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db, auth } from "@/firebase";
import { requireSession } from "@/services/auth";

import { onAuthStateChanged } from "firebase/auth";
import { getLastReadAt, touchLastRead } from "@/services/threadReads";

import {
  doc,
  updateDoc,
  increment,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";


import { MessageSquare, Eye, Bookmark, CheckCircle2, ThumbsUp } from "lucide-react";
// #RTC_CO — F1.2 seguir hilo (sin AuthContext)
import {
  toggleFollow,
  watchFollowCount,
  watchIsFollowing,
} from "@/services/follow";

import { renderSafe } from "@/utils/safeRender";

import { createReplyNotification } from "@/services/notifications";
import { createReport } from "@/services/reports";

/* ----------------------------- Tipos locales ----------------------------- */
type TThread = {
  id: string;
  authorId?: string;          // ya lo tenías
  authorName?: string;        // NUEVO
  authorPhotoUrl?: string | null; // opcional, por si luego lo usas
  title?: string;
  body?: string;
  tags?: string[];
  pinned?: boolean;
  locked?: boolean;
  repliesCount?: number;
  views?: number;
  viewsCount?: number;
  bestPostId?: string;
};


type TPost = {
  id: string;
  body: string;
  authorId?: string;           // 👈 NUEVO
  authorName?: string;
  createdAt?: Timestamp | Date;
  isAnswer?: boolean;
  upvotes?: number;
  // 🔹 Rastro de a quién responde
  parentPostId?: string | null;
  parentAuthorName?: string | null;
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

  // 👇 NUEVO: estado para reportes
  const [reportTarget, setReportTarget] = useState<{
    type: "thread" | "post";
    id: string;
    label: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

    // 👇 NUEVOS estados para “último leído”
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [firstUnreadPostId, setFirstUnreadPostId] = useState<string | null>(null);


  // 🔹 textarea de respuesta
  const replyBoxRef = useRef<HTMLTextAreaElement | null>(null);

  // 🔹 a qué post / autor estoy respondiendo
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    authorName: string;
  } | null>(null);



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

    // 🔹 Quién está logueado (para “primer no leído”)
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return () => off();
  }, []);


// 🔹 Sumar view una sola vez por sesión de navegador
useEffect(() => {
  if (!thread?.id || !db) return;

  console.log("🔁 useEffect views ejecutado para", thread.id);

  const key = `thread-viewed-${thread.id}`;

  if (typeof window !== "undefined") {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }

  const ref = doc(db, "threads", thread.id);
  updateDoc(ref, {
    viewsCount: increment(1),
    lastViewAt: serverTimestamp(),
  }).catch(() => {});
}, [thread]);   // 👈 AQUÍ EL ARREGLO



    // 🔹 Calcular el primer post no leído para este usuario/hilo
  useEffect(() => {
    if (!currentUserId || !thread?.id || posts.length === 0) {
      setFirstUnreadPostId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const lastReadAt = await getLastReadAt(currentUserId, thread.id);
        if (cancelled) return;

        // Primera vez: no marcamos separador todavía
        if (!lastReadAt) {
          setFirstUnreadPostId(null);
          await touchLastRead(currentUserId, thread.id);
          return;
        }

        const lastReadDate = lastReadAt.toDate();

        const firstUnread = posts.find((p) => {
          const created =
            p.createdAt instanceof Timestamp
              ? p.createdAt.toDate()
              : p.createdAt;
          return !!created && created > lastReadDate;
        });

        setFirstUnreadPostId(firstUnread ? firstUnread.id : null);

        // Actualizamos “última lectura”
        await touchLastRead(currentUserId, thread.id);
      } catch (err) {
        console.error("Error al calcular firstUnreadPostId:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, thread?.id, posts]);

    // 🔹 Cuando ya tenemos identificado el primer no leído, hacemos scroll automático
  useEffect(() => {
    if (!firstUnreadPostId) return; // si no hay, no hacemos nada

    const el = document.getElementById(`post-${firstUnreadPostId}`);
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [firstUnreadPostId]);


    // Cuando hago clic en "Responder" en un post concreto
  const handleReplyClick = (post: TPost) => {
    const author = post.authorName ?? "Usuario";
    // Mención automática
    setReply(`@${author} `);
    setReplyingTo({ id: post.id, authorName: author });

    // Baja al textarea y enfoca
    if (replyBoxRef.current) {
      replyBoxRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      replyBoxRef.current.focus();
    }
  };




      // Enviar respuesta
  const onReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !reply.trim()) return;

    try {
      setSaving(true);

      const s = await requireSession();

      const body = reply.trim();
      const authorName = s.displayName ?? s.email ?? "Anónimo";

      await addDoc(collection(db, "posts"), {
        threadId: id,
        body,
        createdAt: serverTimestamp(),
        authorId: s.uid,
        authorName,
        // 🔹 rastro de a quién respondí
        parentPostId: replyingTo?.id ?? null,
        parentAuthorName: replyingTo?.authorName ?? null,
      });

      // 🔹 actualiza contador del hilo
      const threadRef = doc(db, "threads", id);
      await updateDoc(threadRef, {
        repliesCount: increment(1),
        lastActivityAt: serverTimestamp(),
      }).catch(() => {});

          // 🔹 crea notificación para el autor del hilo (buscando varios posibles campos)
      if (thread) {
        const anyThread = thread as any;
        const threadAuthorId =
          thread.authorId ??
          anyThread.authorId ??
          anyThread.author?.id ??
          anyThread.userId ??
          anyThread.ownerId ??
          null;

        console.log("🟣 notif-debug: threadAuthorId", threadAuthorId, {
          thread,
          raw: anyThread,
        });

        if (threadAuthorId && threadAuthorId !== s.uid) {
          try {
            await createReplyNotification({
              threadId: id,
              threadTitle: thread?.title ?? "Sin título",
              threadAuthorId,
              replierId: s.uid,
              replierName: authorName,
            });
            console.log("🟣 notif-debug: notificación creada OK");
          } catch (err) {
            console.error("🟥 notif-debug: error creando notificación:", err);
          }
        } else {
          console.log(
            "🟣 notif-debug: NO se creó notificación (sin autor o autor = replier)"
          );
        }
      }


      setReply("");
      setReplyingTo(null); // deja de mostrar el banner “respondiendo a…”
    } finally {
      setSaving(false);
    }
  };


  // =================== Reportes (Fase 3) ===================
const openReport = (params: { type: "thread" | "post"; id: string; label: string }) => {
  setReportTarget(params);
  setReportReason("");
  setReportError(null);
};

const closeReport = () => {
  if (reportSending) return;
  setReportTarget(null);
  setReportReason("");
  setReportError(null);
};

const handleSubmitReport = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!reportTarget || !reportReason.trim()) return;

  try {
    setReportSending(true);
    setReportError(null);

    const s = await requireSession(); // fuerza login si no hay

    await createReport({
      targetId: reportTarget.id,
      targetType: reportTarget.type,
      reason: reportReason.trim(),
      userId: s.uid,
    });

    setReportTarget(null);
    setReportReason("");
  } catch (err) {
    console.error("Error creando reporte:", err);
    setReportError("Ocurrió un error al enviar el reporte. Intenta de nuevo.");
  } finally {
    setReportSending(false);
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
          {/* Autor del hilo */}
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-[11px] font-bold">
              {(thread?.authorName ?? "U")[0]?.toUpperCase()}
            </div>

            {thread?.authorId ? (
              <Link
                to={`/u/${thread.authorId}`}
                className="font-medium text-slate-800 hover:underline"
              >
                {thread.authorName ?? "Usuario"}
              </Link>
            ) : (
              <span className="font-medium text-slate-800">
                {thread?.authorName ?? "Usuario"}
              </span>
            )}
          </div>

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

            {/* 👇 NUEVO: reportar hilo */}
            {thread?.id && (
              <button
                type="button"
                onClick={() =>
                  openReport({
                    type: "thread",
                    id: thread.id,
                    label: thread.title ?? "este hilo",
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-rose-700 hover:bg-rose-50"
              >
                Reportar
              </button>
            )}
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
        orderedPosts.map((p) => (
          <PostCard
            key={p.id}
            p={p}
            thread={thread!}
            onReplyClick={() => handleReplyClick(p)}
            isFirstUnread={p.id === firstUnreadPostId}
                // 👇 NUEVO
            onReportClick={() =>
              openReport({
                type: "post",
                id: p.id,
                label: p.authorName ?? "esta respuesta",
              })
            }
          />
        ))
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
          ref={replyBoxRef}  
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

      {/* 👇 Modal de reporte */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Reportar {reportTarget.type === "thread" ? "hilo" : "respuesta"}
            </h2>
            <p className="mb-3 text-xs text-slate-600">
              Ayúdanos a mantener la comunidad sana. Explica brevemente qué problema ves en{" "}
              <span className="font-semibold">{reportTarget.label}</span>.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400"
                placeholder="Ejemplo: lenguaje ofensivo, spam, contenido fuera de tema…"
                disabled={reportSending}
              />

              {reportError && (
                <p className="text-xs text-rose-600">{reportError}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReport}
                  disabled={reportSending}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reportSending || !reportReason.trim()}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {reportSending ? "Enviando..." : "Enviar reporte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

/* --------------------------- Subcomponentes UI --------------------------- */

type FollowButtonProps = {
  threadId: string;
};

function FollowButton({ threadId }: FollowButtonProps) {
  const [count, setCount] = useState<number>(0);
  const [following, setFollowing] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!threadId) return;

    // 👁 contador global de seguidores del hilo
    const offCount = watchFollowCount(threadId, (n) => {
      setCount(n ?? 0);
    });

    // ✅ estado “¿yo sigo este hilo?”
    let offFollow: (() => void) | null = null;

    const offAuth = onAuthStateChanged(auth, (user) => {
      // limpiamos suscripción anterior
      if (offFollow) {
        offFollow();
        offFollow = null;
      }

      if (!user) {
        // sin sesión → no sigue (hasta que dé clic y se loguee)
        setFollowing(false);
        return;
      }

      offFollow = watchIsFollowing(user.uid, threadId, (is) => {
        setFollowing(!!is);
      });
    });

    return () => {
      offCount();
      offAuth();
      if (offFollow) offFollow();
    };
  }, [threadId]);

  const handleClick = async () => {
    try {
      setBusy(true);
      const s = await requireSession(); // abre login si no hay
      const res = await toggleFollow(s.uid, threadId);
      if (res) {
        setFollowing(!!res.following);
        // si en el futuro toggleFollow te devuelve count, lo usamos:
        if (typeof (res as any).count === "number") {
          setCount((res as any).count);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const label = following ? "Siguiendo" : "Seguir";
  const displayCount = Number.isFinite(count) ? count : 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
        following
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      } disabled:opacity-60`}
    >
      <span>{label}</span>
      <span className="text-[11px] text-slate-500">· {displayCount}</span>
    </button>
  );
}


  function PostCard({
  p,
  thread,
  onReplyClick,
  isFirstUnread,
  onReportClick,      // 👈 aquí lo agregamos
}: {
  p: TPost;
  thread: TThread;
  onReplyClick: () => void;
  isFirstUnread?: boolean;
  onReportClick: () => void;
}) {

  const when = useMemo(() => fmt(toDate(p.createdAt)), [p.createdAt]);
  const letter = (p.authorName ?? "U")[0]?.toUpperCase();

  const isBest = thread?.bestPostId === p.id;

  // Ref del artículo para hacer scroll al primer no leído
  const rootRef = useRef<HTMLElement | null>(null);

  // 🔹 Scroll automático cuando este post es el primer no leído
  useEffect(() => {
    if (isFirstUnread && rootRef.current) {
      rootRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isFirstUnread]);

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

    // 👇 De momento SIN notificación por like
    // Si luego queremos, aquí llamamos a createLikeNotification(...)
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
      id={`post-${p.id}`}
      ref={rootRef}
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
            {p.authorId ? (
              <Link
                to={`/u/${p.authorId}`}
                className="font-medium text-slate-800 hover:underline"
              >
                {p.authorName ?? "Usuario"}
              </Link>
            ) : (
              <span className="font-medium text-slate-800">
                {p.authorName ?? "Usuario"}
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span>{when}</span>
            {isBest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Respuesta aceptada
              </span>
            )}
          </div>

          {p.parentPostId && p.parentAuthorName && (
            <div className="mb-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-600">
              En respuesta a{" "}
              <span className="font-semibold">@{p.parentAuthorName}</span>
            </div>
          )}

          {/* 🔹 Separador visual para el primer post no leído */}
          {isFirstUnread && (
            <button
              type="button"
              onClick={() => {
                if (rootRef.current) {
                  rootRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
              className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Nuevas respuestas desde tu última visita
            </button>
          )}

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

            {/* Responder: baja al textarea y mete la mención */}
            <button
              type="button"
              onClick={onReplyClick}
              className="rounded-lg border px-2 py-1 hover:bg-slate-50"
            >
              Responder
            </button>

              {/* 👇 NUEVO: reportar respuesta */}
              <button
                type="button"
                onClick={onReportClick}
                className="rounded-lg border border-rose-200 px-2 py-1 text-rose-700 hover:bg-rose-50"
              >
                Reportar
              </button>

            {/* #RTC_CO — F1.3: mejor respuesta */}
            <button
              onClick={toggleBest}
              className={`rounded-lg border px-2 py-1 ${
                isBest
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "hover:bg-slate-50"
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
