import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, loginWithGoogle } from "@/services/auth";
export default function RequireAuth({ children }) {
    const [state, setState] = useState("checking");
    const nav = useNavigate();
    const loc = useLocation();
    useEffect(() => {
        let alive = true;
        getSession()
            .then((s) => alive && setState(s ? "ok" : "no")) // << s, no r.user
            .catch(() => alive && setState("no"));
        return () => {
            alive = false;
        };
    }, []);
    if (state === "checking") {
        return _jsx("div", { className: "p-4 text-sm text-slate-600", children: "Comprobando sesi\u00F3n\u2026" });
    }
    if (state === "no") {
        // Abre Google y vuelve a la misma URL cuando termine
        loginWithGoogle()
            .then(() => nav(loc.pathname + loc.search, { replace: true }))
            .catch(() => nav("/", { replace: true }));
        return _jsx("div", { className: "p-4 text-sm", children: "Redirigiendo a login\u2026" });
    }
    return _jsx(_Fragment, { children: children });
}
