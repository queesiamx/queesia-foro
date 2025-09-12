import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";

const Layout    = lazy(() => import("@components/Layout"));
const ForumMock = lazy(() => import("@pages/ForumMock"));   // landing mock
const Threads   = lazy(() => import("@pages/Threads"));     // feed real (Firebase)
const Thread    = lazy(() => import("@pages/Thread"));      // detalle real
const NewThread = lazy(() => import("@pages/NewThread"));   // crear real
const Rules     = lazy(() => import("@pages/Rules"));
const Home      = lazy(() => import("@pages/Home"));      // ← Home dinámica (Firestore)

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
      // Home: maqueta
      { index: true, element: <Suspense fallback={Fallback}><ForumMock/></Suspense> },

      // Foro real
      { path: "feed",       element: <Suspense fallback={Fallback}><Threads/></Suspense> },
      { path: "thread/:id", element: <Suspense fallback={Fallback}><Thread/></Suspense> },
      { path: "nuevo",      element: <Suspense fallback={Fallback}><NewThread/></Suspense> },
      { path: "reglas",     element: <Suspense fallback={Fallback}><Rules/></Suspense> },

      { path: "live",       element: <Suspense fallback={Fallback}><Home/></Suspense> },
    
    ],
  },
]);
