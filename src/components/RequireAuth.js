import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, requireSession } from "@/services/auth";
export default function RequireAuth({ children }) {
    const [ready, setReady] = useState(false);
    const [session, setSession] = useState(null);
    const nav = useNavigate();
    const loc = useLocation();
    const inited = useRef(false);
    useEffect(() => {
        if (inited.current)
            return;
        inited.current = true;
        (async () => {
            const s = await getSession();
            setSession(s);
            setReady(true);
        })();
    }, []);
    if (!ready) {
        return _jsx("div", { className: "p-4 text-sm text-slate-600", children: "Comprobando sesi\u00F3n\u2026" });
    }
    if (!session) {
        return (_jsxs("div", { className: "p-6 space-y-3", children: [_jsx("div", { className: "text-sm text-slate-700", children: "Necesitas iniciar sesi\u00F3n para continuar." }), _jsx("button", { className: "rounded-md bg-indigo-600 px-3 py-2 text-white text-sm hover:bg-indigo-700", onClick: async () => {
                        const s = await requireSession();
                        setSession(s);
                        nav(loc.pathname + loc.search, { replace: true });
                    }, children: "Acceder con Google" })] }));
    }
    return _jsx(_Fragment, { children: children });
}
