import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchTrendingThreads } from "@/services/forum";
export default function TrendingReal({ title = "Discusiones Trending", pageSize = 3, }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const off = watchTrendingThreads((rows) => {
            setItems(rows);
            setLoading(false);
        }, { pageSize });
        return () => off();
    }, [pageSize]);
    return (_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white", children: [_jsx("div", { className: "px-5 py-4 border-b", children: _jsx("div", { className: "font-semibold", children: title }) }), _jsx("div", { className: "p-4 space-y-3", children: loading ? (Array.from({ length: pageSize }).map((_, i) => (_jsx("div", { className: "h-[82px] rounded-xl border border-slate-200 bg-white animate-pulse" }, i)))) : items.length === 0 ? (_jsx("div", { className: "text-sm text-slate-600", children: "A\u00FAn no hay discusiones." })) : (items.map((t) => _jsx(ThreadRow, { t: t }, t.id))) }), _jsx("div", { className: "border-t px-5 py-3 text-center", children: _jsx(Link, { to: "/feed", className: "text-sm font-medium text-violet-600 hover:underline", children: "Ver todos los temas \u2192" }) })] }));
}
function ThreadRow({ t }) {
    const letter = (t.title?.[0] || "U").toUpperCase();
    const replies = t.repliesCount ?? 0;
    const views = t.views ?? t.viewsCount ?? 0;
    const upvotes = t.upvotesCount ?? 0;
    return (_jsx(Link, { to: `/thread/${t.id}`, className: "block rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 text-white grid place-items-center text-xs font-bold", children: letter }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium truncate", children: t.title }), _jsxs("div", { className: "mt-1 flex items-center gap-4 text-[11px] text-slate-600", children: [_jsxs("span", { children: ["\uD83D\uDCAC ", replies] }), _jsxs("span", { children: ["\uD83D\uDC41 ", views] }), _jsxs("span", { children: ["\uD83D\uDC4D ", upvotes] })] })] })] }) }));
}
