import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/AuthBox.tsx — RTC-CO (escucha sesión + fallback)
import { useEffect, useState } from "react";
import { loginWithGoogle, logoutEverywhere, listenAuth, // 👈 usamos el listener de auth
 } from "@/services/auth";
export default function AuthBox() {
    const [user, setUser] = useState(null);
    const [busy, setBusy] = useState(false);
    // 🔊 Mantén el estado sincronizado en tiempo real
    useEffect(() => {
        return listenAuth((u) => {
            if (!u)
                return setUser(null);
            setUser({
                uid: u.uid,
                email: u.email,
                displayName: u.displayName,
                photoURL: u.photoURL,
            });
        });
    }, []);
    const handleLogin = async () => {
        setBusy(true);
        try {
            await loginWithGoogle(); // el listener actualizará el estado
        }
        catch (e) {
            // Estos errores son comunes con popups; no son críticos
            if (e?.code !== "auth/popup-closed-by-user" &&
                e?.code !== "auth/cancelled-popup-request" &&
                e?.code !== "auth/popup-blocked") {
                console.error(e);
                alert("No se pudo iniciar sesión.");
            }
        }
        finally {
            setBusy(false);
        }
    };
    if (user) {
        return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: user.photoURL ?? "/avatar.svg", alt: user.displayName ?? user.email ?? "usuario", className: "h-8 w-8 rounded-full" }), _jsx("button", { onClick: () => logoutEverywhere({ hardReload: true }), className: "inline-flex items-center rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[.98] transition", children: "Salir" })] }));
    }
    return (_jsxs("button", { onClick: handleLogin, disabled: busy, className: "inline-flex items-center gap-2 rounded-full bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 hover:bg-black/90 active:scale-[.98] disabled:opacity-70 transition", "aria-label": "Iniciar sesi\u00F3n con Google", children: [_jsx(GoogleG, { className: "h-4 w-4" }), _jsx("span", { className: "hidden sm:inline", children: busy ? "Ingresando…" : "Iniciar sesión" }), _jsx("span", { className: "sm:hidden", children: busy ? "…" : "Ingresar" })] }));
}
function GoogleG(props) {
    return (_jsxs("svg", { viewBox: "0 0 533.5 544.3", "aria-hidden": "true", ...props, children: [_jsx("path", { fill: "#4285F4", d: "M533.5 278.4c0-18.7-1.5-37.4-4.7-55.5H272v105h146.9c-6.3 34-27.1 62.8-57.9 82.2v68h93.6c54.9-50.6 78.9-125.1 78.9-199.7z" }), _jsx("path", { fill: "#34A853", d: "M272 544.3c73.9 0 136-24.5 181.3-66.5l-93.6-68c-26 17.5-59.2 27.8-87.7 27.8-67.2 0-124.2-45.2-144.5-106h-96.1v66.6C87 486 173.1 544.3 272 544.3z" }), _jsx("path", { fill: "#FBBC05", d: "M127.5 331.6c-10.3-30.7-10.3-63.7 0-94.4v-66.6H31.4c-41.8 83.4-41.8 181.4 0 264.8l96.1-66.6z" }), _jsx("path", { fill: "#EA4335", d: "M272 106.1c37.9-.6 75.2 14.4 102.7 41.7l76.6-76.6C407.7 24.8 341.2 0 272 0 173.1 0 87 58.3 31.4 170.6l96.1 66.6C147.8 175.1 204.8 129.9 272 129.9z" })] }));
}
