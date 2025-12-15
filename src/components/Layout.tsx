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
