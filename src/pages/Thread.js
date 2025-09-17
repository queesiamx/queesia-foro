import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Thread.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "@/firebase";
import { requireSession } from "@/services/auth";
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp, Timestamp, } from "firebase/firestore";
import { MessageSquare, Eye, Bookmark, CheckCircle2, ThumbsUp, } from "lucide-react";
/* ---------------------------- Utilidades UI/UX --------------------------- */
const toDate = (d) => d instanceof Timestamp ? d.toDate() : d instanceof Date ? d : undefined;
const fmt = (d) => d
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d)
    : "—";
/** Render súper ligero de “markdown” (negritas, itálicas, code, saltos de línea) */
function mdLight(s) {
    return s
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br/>");
}
/* --------------------------------- Página -------------------------------- */
export default function ThreadPage() {
    const { id } = useParams();
    const [thread, setThread] = useState(null);
    const [posts, setPosts] = useState([]);
    const [reply, setReply] = useState("");
    const [saving, setSaving] = useState(false);
    // Suscripciones en vivo
    useEffect(() => {
        if (!id || !db)
            return;
        // 1) Hilo
        const offThread = onSnapshot(doc(db, "threads", id), (snap) => {
            setThread(snap.exists() ? ({ id: snap.id, ...snap.data() }) : null);
        });
        // 2) Respuestas del hilo
        const q = query(collection(db, "posts"), where("threadId", "==", id), orderBy("createdAt", "asc"));
        const offPosts = onSnapshot(q, (snap) => {
            setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => {
            offThread();
            offPosts();
        };
    }, [id]);
    // Enviar respuesta
    // Enviar respuesta
    const onReply = async (e) => {
        e.preventDefault();
        if (!db || !id || !reply.trim())
            return;
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
            setReply("");
        }
        finally {
            setSaving(false);
        }
    };
    if (thread === null) {
        return (_jsx("div", { className: "mx-auto max-w-5xl px-4 py-6", children: _jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-6 text-slate-600", children: "Hilo no encontrado." }) }));
    }
    const repliesShown = thread.repliesCount ?? posts.length;
    const viewsShown = thread.views ?? thread.viewsCount ?? 0;
    return (_jsxs("div", { className: "mx-auto max-w-5xl px-4 py-6 space-y-6", children: [_jsxs("header", { className: "rounded-2xl border border-slate-200 bg-white p-5", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs mb-2", children: [(thread.tags ?? []).map((tg) => (_jsxs("span", { className: "rounded-full bg-slate-100 px-2 py-0.5 text-slate-700", children: ["#", tg] }, tg))), thread.pinned && (_jsx("span", { className: "ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800", children: "\uD83D\uDCCC Fijado" })), thread.locked && (_jsx("span", { className: "ml-1 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700", children: "\uD83D\uDD12 Cerrado" }))] }), _jsx("h1", { className: "text-xl md:text-2xl font-semibold text-slate-900", children: thread?.title ?? "Sin título" }), thread?.body && (_jsx("p", { className: "mt-3 text-[15px] leading-6 text-slate-700", dangerouslySetInnerHTML: { __html: mdLight(thread.body) } })), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600", children: [_jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(MessageSquare, { className: "h-3.5 w-3.5" }), " ", repliesShown] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Eye, { className: "h-3.5 w-3.5" }), " ", viewsShown] }), _jsxs("button", { className: "inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50", children: [_jsx(Bookmark, { className: "h-3.5 w-3.5" }), " Guardar"] }), _jsx(Link, { to: "/feed", className: "hover:underline", children: "\u2190 Volver al feed" })] })] }), _jsx("section", { className: "space-y-3", children: posts.length === 0 ? (_jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 text-slate-600", children: "A\u00FAn no hay respuestas." })) : (posts.map((p) => _jsx(PostCard, { p: p }, p.id))) }), _jsxs("form", { onSubmit: onReply, className: "rounded-2xl border border-slate-200 bg-white p-5", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-800", children: "Escribe una respuesta" }), _jsx("textarea", { value: reply, onChange: (e) => setReply(e.target.value), className: "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400", rows: 5, placeholder: "Comparte tu soluci\u00F3n, c\u00F3digo y contexto\u2026", disabled: thread.locked }), _jsx("div", { className: "mt-3 flex items-center justify-end gap-2", children: _jsx("button", { type: "submit", disabled: saving || thread.locked || !reply.trim(), className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50", children: saving ? "Enviando…" : "Responder" }) })] })] }));
}
/* --------------------------- Subcomponentes UI --------------------------- */
function PostCard({ p }) {
    const when = useMemo(() => fmt(toDate(p.createdAt)), [p.createdAt]);
    const letter = (p.authorName ?? "U")[0]?.toUpperCase();
    return (_jsx("article", { className: `rounded-2xl border bg-white p-4 ${p.isAnswer ? "border-emerald-300" : "border-slate-200"}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-sm font-bold", children: letter }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-600", children: [_jsx("span", { className: "font-medium text-slate-800", children: p.authorName ?? "Usuario" }), _jsx("span", { className: "text-slate-400", children: "\u2022" }), _jsx("span", { children: when }), p.isAnswer && (_jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700", children: [_jsx(CheckCircle2, { className: "h-3.5 w-3.5" }), " Respuesta aceptada"] }))] }), _jsx("div", { className: "prose prose-slate max-w-none text-sm leading-6", 
                            // Si no usas @tailwindcss/typography, igual se ve bien.
                            dangerouslySetInnerHTML: { __html: mdLight(p.body) } }), _jsxs("div", { className: "mt-3 flex items-center gap-2 text-xs text-slate-600", children: [_jsxs("button", { className: "inline-flex items-center gap-1 rounded-lg border px-2 py-1 hover:bg-slate-50", children: [_jsx(ThumbsUp, { className: "h-3.5 w-3.5" }), " ", (p.upvotes ?? 0).toString()] }), _jsx("button", { className: "rounded-lg border px-2 py-1 hover:bg-slate-50", children: "Responder" })] })] })] }) }));
}
