import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/NewThread.tsx
import { useMemo, useState, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Bold, Italic, Code, Hash, Paperclip, HelpCircle, } from "lucide-react";
import { requireSession } from "@/services/auth";
/** Opciones de categorías (mock) */
const CATEGORIES = [
    { id: "general", name: "General" },
    { id: "preguntas", name: "Preguntas" },
    { id: "recursos", name: "Recursos" },
    { id: "anuncios", name: "Anuncios" },
];
/** Render súper ligero de “markdown” (solo demo) */
function mdLight(s) {
    return s
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br/>");
}
export default function NewThread() {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("general");
    const [tags, setTags] = useState("ui, accesibilidad, rendimiento");
    const [content, setContent] = useState("");
    const [preview, setPreview] = useState(false);
    const navigate = useNavigate();
    const taRef = useRef(null);
    const titleOk = title.trim().length >= 3;
    const bodyOk = content.trim().length >= 10;
    const canCreate = titleOk && bodyOk;
    const tagList = useMemo(() => tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6), [tags]);
    const words = useMemo(() => (content.trim() ? content.trim().split(/\s+/).length : 0), [content]);
    const addFormat = (kind) => {
        if (kind === "tag") {
            setTags((t) => (t.trim() ? t.trim() + ", nuevo-tag" : "nuevo-tag"));
            return;
        }
        const ta = taRef.current;
        if (!ta)
            return;
        const { selectionStart, selectionEnd, value } = ta;
        const sel = value.slice(selectionStart, selectionEnd) || "texto";
        let wrapped = sel;
        if (kind === "bold")
            wrapped = `**${sel}**`;
        if (kind === "italic")
            wrapped = `_${sel}_`;
        if (kind === "code")
            wrapped = `\`${sel}\``;
        const newVal = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
        setContent(newVal);
        // Recolocar el cursor al final del insert
        queueMicrotask(() => {
            ta.focus();
            const pos = selectionStart + wrapped.length;
            ta.setSelectionRange(pos, pos);
        });
    };
    // ⬇️ REEMPLAZA COMPLETO tu onSubmit por este
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim())
            return;
        // Sesión obligatoria
        const s = await requireSession();
        const now = serverTimestamp();
        const data = {
            title: title.trim(),
            body: content.trim(),
            category: category || "general",
            tags: tags
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean)
                .slice(0, 6),
            // timestamps / flags
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
            locked: false,
            pinned: false,
            // contadores
            viewsCount: 0,
            repliesCount: 0,
            upvotesCount: 0,
            // autor (sin undefined)
            authorId: s.uid,
            authorName: s.displayName ?? s.email ?? "Anónimo",
            authorPhotoUrl: s.photoURL ?? null,
        };
        try {
            const ref = await addDoc(collection(db, "threads"), data);
            navigate(`/thread/${ref.id}`);
        }
        catch (e) {
            console.error("[addDoc] Firestore error:", e?.code, e?.message, e);
            alert("No se pudo crear el hilo. Revisa consola para el detalle.");
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("div", { className: "border-b border-slate-200 bg-white/80 backdrop-blur", children: _jsx("div", { className: "mx-auto max-w-6xl px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-3 text-sm text-slate-600", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-1 hover:text-slate-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Volver al foro"] }), _jsx("span", { className: "mx-2 text-slate-300", children: "|" }), _jsx("span", { className: "font-medium text-slate-900", children: "Crear nuevo hilo" }), _jsxs("span", { className: "ml-auto hidden items-center gap-2 sm:flex", children: [_jsxs("button", { type: "button", onClick: () => setPreview((v) => !v), className: "inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs hover:bg-slate-50", children: [preview ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }), preview ? "Ocultar preview" : "Ver preview"] }), _jsx("button", { type: "submit", form: "new-thread-form", disabled: !canCreate, className: `rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${canCreate ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"}`, children: "Publicar" })] })] }) }) }), _jsxs("div", { className: "mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 gap-6 lg:grid-cols-12", children: [_jsxs("form", { id: "new-thread-form", onSubmit: onSubmit, className: "lg:col-span-8 space-y-4", children: [_jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4", children: [_jsx("label", { className: "block text-sm font-medium text-slate-800", children: "T\u00EDtulo" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Escribe un t\u00EDtulo claro y directo", className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400" }), _jsxs("div", { className: "mt-1 text-xs text-slate-500 flex items-center justify-between", children: [_jsx("span", { children: "M\u00EDn. 3 caracteres." }), !titleOk && _jsx("span", { className: "text-amber-600", children: "A\u00FAn muy corto" })] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-800", children: "Categor\u00EDa" }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400", children: CATEGORIES.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-800", children: "Etiquetas (separadas por coma)" }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("input", { value: tags, onChange: (e) => setTags(e.target.value), placeholder: "ui, accesibilidad, rendimiento", className: "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400" }), _jsx("button", { type: "button", onClick: () => addFormat("tag"), className: "inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50", title: "Agregar tag r\u00E1pido", children: _jsx(Hash, { className: "h-4 w-4" }) })] }), !!tagList.length && (_jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: tagList.map((t) => (_jsxs("span", { className: "rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700", children: ["#", t] }, t))) }))] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => addFormat("bold"), className: "rounded-md px-2 py-1 text-sm hover:bg-slate-100", title: "Negritas **texto**", children: _jsx(Bold, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => addFormat("italic"), className: "rounded-md px-2 py-1 text-sm hover:bg-slate-100", title: "Cursivas _texto_", children: _jsx(Italic, { className: "h-4 w-4" }) }), _jsx("button", { type: "button", onClick: () => addFormat("code"), className: "rounded-md px-2 py-1 text-sm hover:bg-slate-100", title: "C\u00F3digo `snippet`", children: _jsx(Code, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { type: "button", className: "inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50", title: "Adjuntar (mock)", children: [_jsx(Paperclip, { className: "h-4 w-4" }), "Adjuntar"] }), _jsxs("button", { type: "button", onClick: () => setPreview((v) => !v), className: "inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50", children: [preview ? _jsx(EyeOff, { className: "h-4 w-4" }) : _jsx(Eye, { className: "h-4 w-4" }), preview ? "Ocultar" : "Preview"] })] })] }), _jsxs("div", { className: `grid gap-0 ${preview ? "md:grid-cols-2" : ""}`, children: [_jsxs("div", { className: "p-3", children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-slate-500", children: "Contenido (formato ligero)" }), _jsx("textarea", { ref: taRef, value: content, onChange: (e) => setContent(e.target.value), placeholder: "Escribe el detalle de tu publicaci\u00F3n\u2026", className: "h-[240px] w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400" }), _jsxs("div", { className: "mt-1 flex items-center justify-between text-xs text-slate-500", children: [_jsxs("span", { children: ["Usa ", _jsx("b", { children: "**negritas**" }), ", ", _jsx("i", { children: "_cursivas_" }), ", ", _jsx("code", { children: "`c\u00F3digo`" }), "."] }), _jsxs("span", { children: [words, " palabras \u00B7 m\u00EDn. 10"] })] })] }), preview && (_jsxs("div", { className: "border-t border-slate-200 md:border-l md:border-t-0 p-3", children: [_jsx("div", { className: "mb-1 text-xs font-medium text-slate-500", children: "Previsualizaci\u00F3n" }), _jsx("div", { className: "prose prose-sm max-w-none rounded-lg border border-slate-200 bg-slate-50 p-3", dangerouslySetInnerHTML: { __html: mdLight(content || "_Escribe para ver la preview…_") } })] }))] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-xs text-slate-500 inline-flex items-center gap-1", children: [_jsx(HelpCircle, { className: "h-4 w-4" }), " Pulsa ", _jsx("b", { children: "Ctrl" }), " + ", _jsx("b", { children: "Enter" }), " para crear"] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", className: "rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50", onClick: () => {
                                                    setTitle("");
                                                    setTags("");
                                                    setContent("");
                                                }, children: "Limpiar" }), _jsx("button", { type: "submit", disabled: !canCreate, className: `rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${canCreate ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"}`, children: "Crear hilo" })] })] })] }), _jsx("aside", { className: "lg:col-span-4 space-y-4", children: _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 sticky top:[88px]", children: [_jsx("div", { className: "q-gradient -mx-4 -mt-4 rounded-t-xl px-4 py-3 text-white", children: _jsx("div", { className: "text-sm font-semibold", children: "Sugerencias" }) }), _jsxs("ul", { className: "mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600", children: [_jsxs("li", { children: ["Usa un ", _jsx("b", { children: "t\u00EDtulo descriptivo" }), "."] }), _jsxs("li", { children: ["Incluye ", _jsx("b", { children: "contexto" }), " y qu\u00E9 esperas obtener."] }), _jsxs("li", { children: ["Agrega ", _jsx("b", { children: "etiquetas" }), " (m\u00E1x. 6) para facilitar la b\u00FAsqueda."] }), _jsxs("li", { children: ["Revisa la ", _jsx("b", { children: "previsualizaci\u00F3n" }), " antes de publicar."] })] }), _jsxs("div", { className: "mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600", children: ["Esta es una vista de ", _jsx("b", { children: "prueba (mock)" }), " para dise\u00F1o."] })] }) })] })] }));
}
