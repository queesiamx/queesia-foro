import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./components/pages/Home";
import Threads from "./components/pages/Threads";
import Thread from "./components/pages/Thread";
import NewThread from "./components/pages/NewThread";
import ForumMock from "./components/pages/ForumMock"; // ← NUEVO

import './index.css'   // ← SIN esto, no entra Tailwind


const router = createBrowserRouter([
    // Home = mock sin Layout para evitar doble navbar
  { path: "/", element: <ForumMock /> },

  // Resto de vistas (con tu Layout simple)
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "threads", element: <Threads /> },
      { path: "thread/:id", element: <Thread /> },
      { path: "new", element: <NewThread /> },
    ],
    errorElement: <div style={{padding:16}}>Error de ruta</div>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
