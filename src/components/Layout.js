import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/Layout.tsx — RTC-CO (integrado con <AuthBox />)
import { Outlet, useLocation, Link } from "react-router-dom";
import UserMenu from "@/components/UserMenu";
export default function Layout() {
    const loc = useLocation();
    // Oculta topbar en la landing del foro (ForumMock) y/o secciones del foro real
    const hideTopbar = loc.pathname === "/" || // ForumMock como home
        loc.pathname.startsWith("/live") ||
        // en inglés
        loc.pathname.startsWith("/threads") ||
        loc.pathname.startsWith("/thread") ||
        loc.pathname.startsWith("/new") ||
        // en español
        loc.pathname.startsWith("/hilos") ||
        loc.pathname.startsWith("/tema") ||
        loc.pathname.startsWith("/nuevo");
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [!hideTopbar && (_jsx("header", { className: "sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur", children: _jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/", className: "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-bold", children: "Q" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-slate-500", children: "Queesia" }), _jsx("div", { className: "-mt-1 text-sm font-semibold text-slate-800", children: "Foro" })] })] }), _jsxs("nav", { className: "hidden items-center gap-5 text-sm md:flex", children: [_jsx(Link, { to: "/", className: "text-slate-700 hover:text-slate-900", children: "Inicio" }), _jsx(Link, { to: "/threads", className: "text-slate-700 hover:text-slate-900", children: "Hilos" }), _jsx(Link, { to: "/reglas", className: "text-slate-700 hover:text-slate-900", children: "Reglas" }), _jsx(Link, { to: "/new", className: "rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700", children: "+ Nuevo" })] }), _jsx(UserMenu, {})] }) })), _jsx("main", { className: hideTopbar ? "" : "pt-14", children: _jsx(Outlet, {}) })] }));
}
