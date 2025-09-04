// src/router/index.tsx
import { createBrowserRouter } from "react-router-dom";

import Layout from '@components/Layout'      // <— ANTES: "../pages/Layout"
import ForumMock from '@/pages/ForumMock'
import Home from '@/pages/Home'
import Threads from "@/pages/Threads";
import Thread from "@/pages/Thread";
import NewThread from "@/pages/NewThread";

export const router = createBrowserRouter([
  { path: "/", element: <ForumMock /> },
  {
    path: "/app",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "threads", element: <Threads /> },
      { path: "thread/:id", element: <Thread /> },
      { path: "new", element: <NewThread /> },
    ],
  },
  { path: "*", element: <div style={{ padding: 16 }}>404</div> },
]);
