import { jsx as _jsx } from "react/jsx-runtime";
// src/router/index.tsx — RTC-CO (protección de rutas /nuevo y /new)
import { createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import RequireAuth from "@/components/RequireAuth";
const Layout = lazy(() => import("@components/Layout"));
const ForumMock = lazy(() => import("@pages/ForumMock")); // landing mock
const Threads = lazy(() => import("@pages/Threads")); // feed real (Firebase)
const Thread = lazy(() => import("@pages/Thread")); // detalle real
const NewThread = lazy(() => import("@pages/NewThread")); // crear real
const Rules = lazy(() => import("@pages/Rules"));
const Home = lazy(() => import("@pages/Home")); // Home dinámica (Firestore)
const Fallback = _jsx("div", { style: { padding: 16 }, children: "Cargando\u2026" });
const S = ({ children }) => (_jsx(Suspense, { fallback: Fallback, children: children }));
export const router = createBrowserRouter([
    {
        path: "/",
        element: (_jsx(S, { children: _jsx(Layout, {}) })),
        children: [
            // Home: maqueta
            { index: true, element: _jsx(S, { children: _jsx(ForumMock, {}) }) },
            // Foro real
            { path: "feed", element: _jsx(S, { children: _jsx(Threads, {}) }) },
            { path: "thread/:id", element: _jsx(S, { children: _jsx(Thread, {}) }) },
            { path: "reglas", element: _jsx(S, { children: _jsx(Rules, {}) }) },
            // Home “live” (dinámica)
            { path: "live", element: _jsx(S, { children: _jsx(Home, {}) }) },
            // Crear hilo (protegido) — español
            {
                path: "nuevo",
                element: (_jsx(RequireAuth, { children: _jsx(S, { children: _jsx(NewThread, {}) }) })),
            },
            // Crear hilo (protegido) — inglés
            {
                path: "new",
                element: (_jsx(RequireAuth, { children: _jsx(S, { children: _jsx(NewThread, {}) }) })),
            },
        ],
    },
]);
