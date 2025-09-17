import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listenAuth, loginWithGoogle, logoutEverywhere, } from "@/services/auth";
export default function UserMenu() {
    const [user, setUser] = useState(null);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const panelRef = useRef(null);
    const btnRef = useRef(null);
    // Mantén la sesión sincronizada
    useEffect(() => listenAuth(u => {
        if (!u)
            return setUser(null);
        setUser({
            uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL,
        });
    }), []);
    // Cerrar al hacer click afuera o con Escape
    useEffect(() => {
        function onDoc(e) {
            if (!open)
                return;
            const t = e.target;
            if (panelRef.current?.contains(t) || btnRef.current?.contains(t))
                return;
            setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape")
                setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDoc);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);
    // Si no hay sesión: botón negro "Iniciar sesión"
    if (!user) {
        const onLogin = async () => {
            setBusy(true);
            try {
                await loginWithGoogle();
            }
            finally {
                setBusy(false);
            }
        };
        return (_jsxs("button", { ref: btnRef, onClick: onLogin, disabled: busy, className: "inline-flex items-center gap-2 rounded-full bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 hover:bg-black/90 active:scale-[.98] disabled:opacity-70 transition", children: [_jsx(GoogleG, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: busy ? "Ingresando…" : "Iniciar sesión" }), _jsx("span", { className: "sm:hidden", children: busy ? "…" : "Ingresar" })] }));
    }
    // Con sesión: avatar + menú
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { ref: btnRef, onClick: () => setOpen(v => !v), "aria-haspopup": "menu", "aria-expanded": open, className: "h-9 w-9 overflow-hidden rounded-full ring-1 ring-black/5 shadow-sm hover:brightness-95 active:scale-[.98] transition", title: user.displayName ?? user.email ?? "Cuenta", children: _jsx("img", { src: user.photoURL ?? "/avatar.svg", alt: "", className: "h-full w-full object-cover", referrerPolicy: "no-referrer" }) }), open && (_jsxs("div", { ref: panelRef, role: "menu", className: "absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg", children: [_jsx("div", { className: "px-3 py-2 text-sm text-slate-600", children: _jsx("div", { className: "truncate font-medium text-slate-900", children: user.displayName || user.email || "Usuario" }) }), _jsx("div", { className: "my-1 h-px bg-slate-200" }), _jsx(MenuItem, { to: "/mis-consultas", children: "ej. op1" }), _jsx(MenuItem, { to: "/perfil", children: "ej. op2" }), _jsx("div", { className: "my-1 h-px bg-slate-200" }), _jsx("button", { onClick: () => logoutEverywhere({ hardReload: true }), className: "w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50", role: "menuitem", children: "Cerrar sesi\u00F3n" })] }))] }));
}
function MenuItem({ to, children }) {
    return (_jsx(Link, { to: to, className: "block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50", role: "menuitem", children: children }));
}
function GoogleG(props) {
    return (_jsxs("svg", { viewBox: "0 0 533.5 544.3", "aria-hidden": "true", ...props, children: [_jsx("path", { fill: "#4285F4", d: "M533.5 278.4c0-18.7-1.5-37.4-4.7-55.5H272v105h146.9c-6.3 34-27.1 62.8-57.9 82.2v68h93.6c54.9-50.6 78.9-125.1 78.9-199.7z" }), _jsx("path", { fill: "#34A853", d: "M272 544.3c73.9 0 136-24.5 181.3-66.5l-93.6-68c-26 17.5-59.2 27.8-87.7 27.8-67.2 0-124.2-45.2-144.5-106h-96.1v66.6C87 486 173.1 544.3 272 544.3z" }), _jsx("path", { fill: "#FBBC05", d: "M127.5 331.6c-10.3-30.7-10.3-63.7 0-94.4v-66.6H31.4c-41.8 83.4-41.8 181.4 0 264.8l96.1-66.6z" }), _jsx("path", { fill: "#EA4335", d: "M272 106.1c37.9-.6 75.2 14.4 102.7 41.7l76.6-76.6C407.7 24.8 341.2 0 272 0 173.1 0 87 58.3 31.4 170.6l96.1 66.6C147.8 175.1 204.8 129.9 272 129.9z" })] }));
}
