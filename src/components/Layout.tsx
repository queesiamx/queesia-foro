// src/components/Layout.tsx — RTC-CO (integrado con Footer global)
// Mantiene todas tus condiciones de hideTopbar, menú y sesión.

import { Outlet, useLocation, Link } from "react-router-dom";
import Footer from "@/components/Footer";
import AuthBox from "@/components/AuthBox";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

export default function Layout() {
  const loc = useLocation();

  // Oculta topbar en la landing del foro (ForumMock) y/o secciones del foro real
  const hideTopbar =
    loc.pathname === "/" ||          // solo landing mock
    loc.pathname.startsWith("/live"); // y, si quieres, la home dinámica

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      {/* 🔹 NAVBAR GLOBAL */}
      {!hideTopbar && (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3">
            
            {/* Marca */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-bold"
              >
                Q
              </Link>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Queesia</div>
                <div className="-mt-1 text-sm font-semibold text-slate-800">Foro</div>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden items-center gap-5 text-sm md:flex">
              <Link to="/" className="text-slate-700 hover:text-slate-900">Inicio</Link>
              <Link to="/threads" className="text-slate-700 hover:text-slate-900">Hilos</Link>
              <Link to="/reglas" className="text-slate-700 hover:text-slate-900">Reglas</Link>
              <Link
                to="/new"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700"
              >
                + Nuevo
              </Link>
            </nav>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu />
            </div>

          </div>
        </header>
      )}

      {/* 🔹 CONTENIDO DINÁMICO */}
      <main className={`flex-1 ${hideTopbar ? "" : "pt-14"}`}>
        <Outlet />
      </main>

      {/* 🔹 FOOTER GLOBAL */}
      {!hideTopbar && (
        <footer className="border-t border-slate-200 bg-white">
          <Footer />
        </footer>
      )}
    </div>
  );
}
