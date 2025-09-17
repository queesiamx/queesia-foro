import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSidebarCounts } from "@/services/forum";
import { Search, Plus, MessageSquare, Eye, Tag, Clock, Pin, CheckCircle2, ChevronDown, Filter, Users } from "lucide-react";
import { motion } from "framer-motion";
import TrendingReal from "@/components/TrendingReal";
// RTC-CO (Home.tsx – imports)
import UserMenu from "@/components/UserMenu";
// --- Mock data ---
const CATEGORIES = [
    { id: "all", name: "Todas", color: "bg-slate-200 text-slate-700" },
    { id: "anuncios", name: "Anuncios", color: "bg-amber-100 text-amber-800" },
    { id: "general", name: "General", color: "bg-indigo-100 text-indigo-800" },
    { id: "preguntas", name: "Preguntas", color: "bg-emerald-100 text-emerald-800" },
    { id: "recursos", name: "Recursos", color: "bg-cyan-100 text-cyan-800" },
];
const THREADS = [
    { id: 1, title: "¿Cómo integro Firebase Auth con Vite + React sin romper el routing?",
        excerpt: "Estoy migrando a un microproyecto y quiero mantener sesiones limpias y un modal de login...",
        author: { name: "Misael", handle: "@misa", avatar: null },
        createdAt: "hace 2 h", lastActivity: { by: "Carla", when: "hace 10 min" },
        category: "preguntas", tags: ["firebase", "vite", "auth"], pinned: true, solved: false, replies: 12, views: 425 },
    { id: 2, title: "Guía visual de estilos para el foro (v1)",
        excerpt: "Colores, espaciados, radios y componentes base para que el foro se parezca al mock.",
        author: { name: "Equipo Queesia", handle: "@core", avatar: null },
        createdAt: "ayer", lastActivity: { by: "Leo", when: "hace 3 h" },
        category: "anuncios", tags: ["ui", "tailwind"], pinned: true, solved: true, replies: 8, views: 980 },
    { id: 3, title: "Colecciones y reglas para Comentarios, Likes y Reportes",
        excerpt: "Estructura mínima en Firestore para lanzar rápido: experts, comments, likes, reports...",
        author: { name: "Nora", handle: "@noradev", avatar: null },
        createdAt: "hace 3 días", lastActivity: { by: "Raúl", when: "hace 1 h" },
        category: "recursos", tags: ["firestore", "reglas", "seguridad"], pinned: false, solved: true, replies: 17, views: 2210 },
    { id: 4, title: "[Ayuda] Sombra amarilla debajo de la navbar: ¿de dónde sale?",
        excerpt: "Ya revisé el layout y el tailwind.config, pero aparece una franja amarilla misteriosa...",
        author: { name: "Tupeck", handle: "@tupeck", avatar: null },
        createdAt: "hace 5 días", lastActivity: { by: "Majo", when: "hace 30 min" },
        category: "general", tags: ["debug", "css"], pinned: false, solved: false, replies: 4, views: 310 },
];
const CatChip = ({ id }) => {
    const cat = CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
    return (_jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`, children: [_jsx(Tag, { className: "h-3 w-3" }), " ", cat.name] }));
};
const Toggle = ({ checked, onChange }) => (_jsx("button", { onClick: onChange, className: `relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`, "aria-pressed": checked, children: _jsx("span", { className: `inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"}` }) }));
const threadsFilterSort = (threads, q, category, onlySolved, sort) => {
    let list = [...threads];
    if (category !== "all")
        list = list.filter((t) => t.category === category);
    if (onlySolved)
        list = list.filter((t) => t.solved);
    if (q.trim()) {
        const z = q.toLowerCase();
        list = list.filter((t) => t.title.toLowerCase().includes(z) ||
            t.excerpt.toLowerCase().includes(z) ||
            t.tags.some((x) => x.toLowerCase().includes(z)));
    }
    switch (sort) {
        case "populares":
            list.sort((a, b) => b.views - a.views);
            break;
        case "sinrespuesta":
            list.sort((a, b) => a.replies - b.replies);
            break;
        default: list.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id);
    }
    return list;
};
// --- UI pieces ---
function Navbar({ onCreate }) {
    return (_jsx("div", { className: "sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-bold", children: "Q" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm uppercase tracking-wider text-slate-500", children: "Queesia" }), _jsx("div", { className: "-mt-1 text-base font-semibold text-slate-800", children: "Foro" })] })] }), _jsxs("div", { className: "hidden items-center gap-6 md:flex", children: [_jsx(Link, { className: "text-sm font-medium text-slate-700 hover:text-slate-900", to: "/", children: "Inicio" }), _jsx(Link, { className: "text-sm font-medium text-slate-700 hover:text-slate-900", to: "/feed", children: "Categor\u00EDas" }), _jsx(Link, { className: "text-sm font-medium text-slate-700 hover:text-slate-900", to: "/reglas", children: "Reglas" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: onCreate, className: "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white bg-brand-grad-rev hover:brightness-95", children: [" ", _jsx(Plus, { className: "h-4 w-4" }), " Crear tema"] }), _jsx(UserMenu, {})] })] }) }));
}
function FiltersBar({ q, setQ, category, setCategory, onlySolved, setOnlySolved, sort, setSort, }) {
    return (_jsx("div", { className: "sticky top-[60px] z-30 border-b border-slate-200 bg-white/80 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { className: "flex flex-1 items-center gap-2", children: [_jsxs("div", { className: "relative w-full max-w-xl", children: [_jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }), _jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar temas, etiquetas o autores...", className: "w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400" })] }), _jsxs("div", { className: "hidden items-center gap-2 md:flex", children: [_jsx(Filter, { className: "h-4 w-4 text-slate-400" }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-indigo-400", children: CATEGORIES.map((c) => _jsx("option", { value: c.id, children: c.name }, c.id)) }), _jsx("div", { className: "h-6 w-px bg-slate-200" }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-700", children: [_jsx(Toggle, { checked: onlySolved, onChange: () => setOnlySolved(!onlySolved) }), "Solo resueltos"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-slate-500", children: "Ordenar:" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: sort, onChange: (e) => setSort(e.target.value), className: "appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 focus:border-indigo-400", children: [_jsx("option", { value: "recientes", children: "Recientes" }), _jsx("option", { value: "populares", children: "Populares" }), _jsx("option", { value: "sinrespuesta", children: "Sin respuesta" })] }), _jsx(ChevronDown, { className: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" })] })] })] }) }));
}
function ThreadCard({ t }) {
    return (_jsx(motion.div, { layout: true, initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, className: "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-semibold", children: t.author.name[0] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [t.pinned && _jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800", children: [_jsx(Pin, { className: "h-3 w-3" }), " Fijado"] }), t.solved && _jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800", children: [_jsx(CheckCircle2, { className: "h-3 w-3" }), " Resuelto"] }), _jsx(CatChip, { id: t.category })] }), _jsx(Link, { to: "/feed", className: "mt-2 block truncate text-lg font-semibold text-slate-900 hover:underline", children: t.title }), _jsx("p", { className: "mt-1 line-clamp-2 text-sm text-slate-600", children: t.excerpt }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500", children: [_jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Users, { className: "h-3 w-3" }), " ", t.author.name, " ", _jsx("span", { className: "text-slate-400", children: "\u00B7" }), " ", t.createdAt] }), _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), " \u00DAltima act.: ", t.lastActivity.by, " \u00B7 ", t.lastActivity.when] }), _jsx("div", { className: "hidden h-3 w-px bg-slate-200 sm:block" }), _jsx("div", { className: "flex flex-wrap items-center gap-1", children: t.tags.map((tag) => _jsxs("span", { className: "rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700", children: ["#", tag] }, tag)) })] })] }), _jsxs("div", { className: "ml-auto flex shrink-0 flex-col items-end gap-1", children: [_jsxs("div", { className: "inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700", children: [_jsx(MessageSquare, { className: "h-3.5 w-3.5" }), " ", t.replies] }), _jsxs("div", { className: "inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700", children: [_jsx(Eye, { className: "h-3.5 w-3.5" }), " ", t.views] })] })] }) }));
}
function Sidebar({ onCreate }) {
    const [counts, setCounts] = useState(null);
    useEffect(() => {
        getSidebarCounts().then(setCounts).catch(console.error);
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "\u00BFTienes una duda o recurso?" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Publica un tema y la comunidad te apoya. Mant\u00E9n un tono cordial y comparte contexto." }), _jsxs("button", { onClick: onCreate, className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700", children: [_jsx(Plus, { className: "h-4 w-4" }), " Crear tema"] })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Estad\u00EDsticas" }), counts ? (_jsxs("ul", { className: "mt-3 space-y-1 text-sm text-slate-700", children: [_jsxs("li", { children: ["Temas activos: ", _jsx("b", { children: counts.trending })] }), _jsxs("li", { children: ["Recientes (7 d\u00EDas): ", _jsx("b", { children: counts.recientes })] }), _jsxs("li", { children: ["Populares: ", _jsx("b", { children: counts.populares })] }), _jsxs("li", { children: ["Preguntas: ", _jsx("b", { children: counts.preguntas })] }), _jsxs("li", { children: ["Tutoriales: ", _jsx("b", { children: counts.tutoriales })] })] })) : (_jsx("div", { className: "mt-3 h-16 rounded-lg bg-slate-50 animate-pulse" }))] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Categor\u00EDas" }), _jsx("div", { className: "mt-3 space-y-2", children: CATEGORIES.filter((c) => c.id !== "all").map((c) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full ${c.color.split(" ")[0]}` }), _jsx("span", { className: "text-sm text-slate-700", children: c.name })] }), _jsx("span", { className: "rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700", children: Math.floor(Math.random() * 40) + 3 })] }, c.id))) })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Tops de la semana" }), _jsx("ul", { className: "mt-3 space-y-3", children: ["Misael", "Nora", "Carla", "Leo"].map((u, i) => (_jsxs("li", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold", children: u[0] }), _jsx("span", { className: "text-sm text-slate-700", children: u })] }), _jsxs("span", { className: "text-xs text-slate-500", children: [(10 - i) * 3, " pts"] })] }, u))) })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900", children: "Reglas r\u00E1pidas" }), _jsxs("ul", { className: "mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1", children: [_jsx("li", { children: "Respeto y claridad en los t\u00EDtulos." }), _jsx("li", { children: "Comparte c\u00F3digo, capturas y contexto." }), _jsxs("li", { children: ["Marca como ", _jsx("span", { className: "font-medium text-emerald-700", children: "Resuelto" }), " cuando apliques una soluci\u00F3n."] })] })] })] }));
}
function ForumMock() {
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("all");
    const [onlySolved, setOnlySolved] = useState(false);
    const [sort, setSort] = useState("recientes");
    const filtered = useMemo(() => threadsFilterSort(THREADS, q, category, onlySolved, sort), [q, category, onlySolved, sort]);
    const nav = useNavigate();
    const handleCreate = () => nav("/nuevo");
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx(Navbar, { onCreate: handleCreate }), _jsx(FiltersBar, { q: q, setQ: setQ, category: category, setCategory: setCategory, onlySolved: onlySolved, setOnlySolved: setOnlySolved, sort: sort, setSort: setSort }), _jsxs("main", { className: "mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12", children: [_jsxs("section", { className: "space-y-3 lg:col-span-8 xl:col-span-9", children: [filtered.map((t) => _jsx(ThreadCard, { t: t }, t.id)), _jsxs("div", { className: "flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700", children: [_jsxs("span", { children: ["Mostrando ", _jsx("b", { children: Math.min(filtered.length, 10) }), " de ", _jsx("b", { children: filtered.length })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50", children: "Anterior" }), _jsx("button", { className: "rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50", children: "Siguiente" })] })] })] }), _jsxs("aside", { className: "lg:col-span-4 xl:col-span-3 space-y-4", children: [_jsx(TrendingReal, { title: "Ahora mismo en la comunidad", pageSize: 3 }), _jsx(Sidebar, { onCreate: handleCreate })] })] }), _jsx("footer", { className: "border-t border-slate-200 bg-white/80", children: _jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-slate-500", children: [_jsxs("p", { children: ["\u00A9 ", new Date().getFullYear(), " Queesia \u00B7 Comunidad"] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("a", { href: "#", className: "hover:text-slate-700", children: "Privacidad" }), _jsx("a", { href: "#", className: "hover:text-slate-700", children: "T\u00E9rminos" }), _jsx("a", { href: "https://queesia.com/contacto", className: "hover:text-slate-700", children: "Contacto" })] })] }) })] }));
}
export default ForumMock;
