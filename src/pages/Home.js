import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { watchTrendingThreads } from "@/services/forum";
import { Link } from "react-router-dom"; // <-- usa Link
function SkeletonList() {
    return (_jsx(_Fragment, { children: Array.from({ length: 4 }).map((_, i) => (_jsx("div", { className: "h-[96px] rounded-xl border border-slate-200 bg-white animate-pulse" }, i))) }));
}
function Empty() {
    return (_jsx("div", { className: "rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600", children: "A\u00FAn no hay discusiones trending." }));
}
export default function Home() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const off = watchTrendingThreads((rows) => {
            setItems(rows);
            setLoading(false);
        }, { pageSize: 12 });
        return () => off();
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "font-semibold", children: "Discusiones Trending" }), _jsxs("span", { className: "text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full", children: [items.length, " nuevas"] })] }), _jsx("div", { className: "space-y-4", children: loading ? (_jsx(SkeletonList, {})) : items.length === 0 ? (_jsx(Empty, {})) : (items.map((t) => _jsx(PostCard, { t: t }, t.id))) }), _jsx("div", { className: "pt-2", children: _jsx(Link, { to: "/feed", className: "mx-auto block rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 text-center", children: "Ver todos los temas" }) })] }));
}
function PostCard({ t }) {
    const letter = (t.title?.[0] || "U").toUpperCase();
    // Normaliza nombres de campos sin cambiar el tipo global
    const replies = t.repliesCount ?? 0;
    const views = t.views ?? t.viewsCount ?? 0;
    const upvotes = t.upvotesCount ?? 0;
    return (_jsx(Link, { to: `/thread/${t.id}`, className: "block rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 text-white grid place-items-center text-sm font-bold", children: letter }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center gap-2 text-xs mb-1", children: (t.tags ?? []).slice(0, 4).map((tg) => (_jsxs("span", { className: "rounded-full bg-slate-100 px-2 py-0.5", children: ["#", tg] }, tg))) }), _jsx("div", { className: "font-semibold hover:underline truncate", children: t.title }), _jsxs("div", { className: "mt-1 flex items-center gap-4 text-xs text-slate-600", children: [_jsxs("span", { children: ["\uD83D\uDCAC ", replies] }), _jsxs("span", { children: ["\uD83D\uDC41 ", views] }), _jsxs("span", { children: ["\uD83D\uDC4D ", upvotes] })] })] })] }) }));
}
