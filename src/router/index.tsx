import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";

const Layout    = lazy(() => import("@components/Layout"));
const ForumMock = lazy(() => import("@pages/ForumMock"));
const Home      = lazy(() => import("@pages/Home"));      // foro “real” (con Firestore)
const Threads   = lazy(() => import("@pages/Threads"));
const Thread    = lazy(() => import("@pages/Thread"));
const NewThread = lazy(() => import("@pages/NewThread"));
const Rules = lazy(() => import("@/pages/Rules"));

const Fallback = <div style={{ padding: 16 }}>Cargando…</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={Fallback}>
        <Layout />
      </Suspense>
    ),
    children: [
      // ⬇️ Landing principal: MOCK
      {
        index: true,
        element: (
          <Suspense fallback={Fallback}>
            <ForumMock />
          </Suspense>
        ),
      },

      {
  path: "reglas",
  element: (
    <Suspense fallback={<div className="p-4">Cargando…</div>}>
      <Rules />
    </Suspense>
  ),
},
      // ⬇️ Sección “real” (con Firestore) detrás de /live
      {
        path: "live",
        element: (
          <Suspense fallback={Fallback}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "threads",
        element: (
          <Suspense fallback={Fallback}>
            <Threads />
          </Suspense>
        ),
      },
      {
        path: "thread/:id",
        element: (
          <Suspense fallback={Fallback}>
            <Thread />
          </Suspense>
        ),
      },
      {
        path: "new",
        element: (
          <Suspense fallback={Fallback}>
            <NewThread />
          </Suspense>
        ),
      },
    ],
  },
]);
