// src/router/index.tsx — RTC-CO (protección de rutas /nuevo y /new)
import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import RequireAuth from "@/components/RequireAuth";
import NotificationsPage from "@/pages/Notifications";

const Layout    = lazy(() => import("@components/Layout"));
const ForumMock = lazy(() => import("@pages/ForumMock"));   // landing mock
const Threads   = lazy(() => import("@pages/Threads"));     // feed real (Firebase)
const Thread    = lazy(() => import("@pages/Thread"));      // detalle real
const NewThread = lazy(() => import("@pages/NewThread"));   // crear real
const Rules     = lazy(() => import("@pages/Rules"));
const Home      = lazy(() => import("@pages/Home"));        // Home dinámica (Firestore)
const UserProfilePage = lazy(() => import("@pages/UserProfile"));

// 👇 NUEVO: página de reportes de admin
const AdminReportsPage = lazy(
  () => import("@pages/AdminReports")
);

const Fallback = <div style={{ padding: 16 }}>Cargando…</div>;
const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={Fallback}>{children}</Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <S>
        <Layout />
      </S>
    ),
    children: [
      // Home: maqueta
      { index: true, element: <S><ForumMock /></S> },

      // Foro real
      { path: "feed",       element: <S><Threads /></S> },
      { path: "thread/:id", element: <S><Thread /></S> },
      { path: "u/:uid", element: <S><UserProfilePage /></S> },
      { path: "reglas",     element: <S><Rules /></S> },

      {
        path: "notificaciones",
        element: <NotificationsPage />, // RTC_CO — vista completa de notificaciones
      },

      

      // 🔐 Panel de moderación: requiere login
      // y dentro del componente se verifica el correo admin
      {
        path: "admin/reports",        // 👈 sin slash inicial, es hijo de "/"
        element: (
          <RequireAuth>
            <S><AdminReportsPage /></S>
          </RequireAuth>
        ),
      },


      // Home “live” (dinámica)
      { path: "live",       element: <S><Home /></S> },

      // Crear hilo (protegido) — español
      {
        path: "nuevo",
        element: (
          <RequireAuth>
            <S><NewThread /></S>
          </RequireAuth>
        ),
      },
      // Crear hilo (protegido) — inglés
      {
        path: "new",
        element: (
          <RequireAuth>
            <S><NewThread /></S>
          </RequireAuth>
        ),
      },
    ],
  },
]);
