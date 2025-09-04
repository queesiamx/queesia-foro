import { createBrowserRouter } from "react-router-dom";
import React, { Suspense, lazy } from "react";

const Layout   = lazy(() => import("@components/Layout"));
const ForumMock = lazy(() => import("@pages/ForumMock"));
const Home     = lazy(() => import("@pages/Home"));
const Threads  = lazy(() => import("@pages/Threads"));
const Thread   = lazy(() => import("@pages/Thread"));
const NewThread= lazy(() => import("@pages/NewThread"));

const Fallback = <div style={{padding:16}}>Cargando…</div>;

export const router = createBrowserRouter([
  // Home mínimo para probar que renderiza
  { path: "/", element: <Suspense fallback={Fallback}><ForumMock /></Suspense> },

  {
    path: "/app",
    element: <Suspense fallback={Fallback}><Layout /></Suspense>,
    children: [
      { index: true, element: <Suspense fallback={Fallback}><Home /></Suspense> },
      { path: "threads",  element: <Suspense fallback={Fallback}><Threads /></Suspense> },
      { path: "thread/:id", element: <Suspense fallback={Fallback}><Thread /></Suspense> },
      { path: "new",      element: <Suspense fallback={Fallback}><NewThread /></Suspense> },
    ],
  },

  { path: "*", element: <div style={{padding:16}}>404</div> },
]);
