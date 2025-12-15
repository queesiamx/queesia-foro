// src/components/ForumNavbar.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Menu, X, ShieldAlert } from "lucide-react";

import { auth } from "@/firebase";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

export default function ForumNavbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      const email = user?.email ?? "";
      setIsAdmin(ADMIN_EMAILS.includes(email));
    });
    return () => off();
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="fixed top-0 left-0 z-50 w-full h-16
                 bg-white/40 backdrop-blur-xl border border-white/40
                 shadow-md shadow-slate-900/10"
    >
      <div
        className="
          fixed top-0 left-0 z-50 w-full
          h-14 flex items-center justify-between
          px-4
          bg-white/40 backdrop-blur-xl
          border-b border-white/40
          shadow-sm shadow-slate-900/5
        "
      >
        {/* IZQUIERDA: Marca */}
        <a
          href="https://queesia.com"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-3"
          aria-label="Ir a Queesia"
          onClick={closeMobile}
        >
          <img src="/logo-bg.png" alt="Queesia" className="h-9 w-9" />
          <div className="leading-none">
            <div className="text-3xl font-bold italic">
              <span className="text-black">quees</span>
              <span className="text-blue-500">ia</span>
            </div>
          </div>
        </a>

        {/* DERECHA: Desktop nav + acciones */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-lg text-black">
            <a
              href="https://queesia.com/#catalogo"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Catálogo
            </a>
            <a
              href="https://queesia.com/casos"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Quesos de éxito
            </a>
            <a
              href="https://expertos.queesia.com"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Expertos
            </a>

            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Foro
            </Link>

            <a
              href="https://queesia.com/blog/"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://queesia.com/nosotros"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Sobre Nosotros
            </a>
            <a
              href="https://queesia.com/contacto"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Contáctanos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/reports"
                className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg
                           border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800
                           hover:bg-amber-100"
              >
                <ShieldAlert className="h-4 w-4" />
                Panel moderación
              </Link>
            )}

            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        {/* MÓVIL: acciones + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />
          <UserMenu />

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                       border border-white/40 bg-white/30 backdrop-blur
                       hover:bg-white/40"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* PANEL MÓVIL */}
      {mobileOpen && (
        <div className="fixed top-14 left-0 z-50 w-full lg:hidden">
          <div className="mx-3 mt-2 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-900/10 overflow-hidden">
            <div className="flex flex-col p-3 text-base text-slate-900">
              <a
                href="https://queesia.com/#catalogo"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Catálogo
              </a>
              <a
                href="https://queesia.com/casos"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Quesos de éxito
              </a>
              <a
                href="https://expertos.queesia.com"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Expertos
              </a>
              <Link
                to="/"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Foro
              </Link>
              <a
                href="https://queesia.com/blog/"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Blog
              </a>
              <a
                href="https://queesia.com/nosotros"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Sobre Nosotros
              </a>
              <a
                href="https://queesia.com/contacto"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Contáctanos
              </a>

              {isAdmin && (
                <>
                  <div className="my-2 h-px bg-slate-200/70" />
                  <Link
                    to="/admin/reports"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2
                               bg-amber-50/80 border border-amber-200 text-amber-900 font-semibold"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Panel moderación
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* overlay para cerrar al tocar fuera */}
          <button
            onClick={closeMobile}
            className="fixed inset-0 -z-10 cursor-default"
            aria-label="Cerrar menú (overlay)"
          />
        </div>
      )}
    </header>
  );
}
