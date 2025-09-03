// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./components/pages/Home";
import Threads from "./components/pages/Threads";
import Thread from "./components/pages/Thread";
import NewThread from "./components/pages/NewThread";
import ForumMock from "./components/pages/ForumMock";

import "./index.css";

// 1) Landing SIN layout en "/"
// 2) Resto de vistas CON layout bajo rutas distintas (evitamos index en "/")
const router = createBrowserRouter([
  { path: "/", element: <ForumMock /> }, // landing sin navbar

  {
    path: "/",
    element: <Layout />,
    children: [
      // mueve Home a /home para evitar colisión con la landing
      { path: "home", element: <Home /> },
      { path: "threads", element: <Threads /> },
      { path: "thread/:id", element: <Thread /> },
      { path: "new", element: <NewThread /> },
    ],
    errorElement: <div style={{ padding: 16 }}>Error de ruta</div>,
  },

  // 404 explícito (opcional)
  { path: "*", element: <div style={{ padding: 16 }}>404</div> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
