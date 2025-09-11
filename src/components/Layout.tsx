// src/components/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();

  // Oculta topbar en la landing del foro (ForumMock) y/o secciones del foro real
  const hideTopbar =
    loc.pathname === "/" ||               // ForumMock como home
    loc.pathname.startsWith("/live") ||   // foro “real” si lo pusiste en /live
    loc.pathname.startsWith("/threads") ||
    loc.pathname.startsWith("/thread") ||
    loc.pathname.startsWith("/new");

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideTopbar && (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
          {/* ...contenido de la barra (Home | Hilos | + Nuevo)... */}
        </header>
      )}

      <main className={hideTopbar ? "" : "pt-14"}>
        <Outlet />
      </main>
    </div>
  );
}
