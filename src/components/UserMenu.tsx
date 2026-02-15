// src/components/UserMenu.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listenAuth, loginUnified, logoutEverywhere, type Session } from "@/services/auth";

// correos con acceso a las vistas de admin
const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

export default function UserMenu() {
  const [user, setUser] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () =>
      listenAuth((u) => {
        if (!u) return setUser(null);
        setUser({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
        });
      }),
    []
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

// Si no hay sesión: botón "Iniciar sesión"
if (!user) {
  const onLogin = async () => {
    console.log("[UserMenu] click login");
    setBusy(true);
    try {
      await loginUnified();
    } catch (e) {
      console.error("[UserMenu] login error", e);
      alert(
        (e as any)?.code
          ? `${(e as any).code}: ${(e as any).message}`
          : String(e)
      );
    } finally {
      setBusy(false);
    }
  };

  
    return (
      <button
        ref={btnRef}
        onClick={onLogin}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 hover:bg-black/90 active:scale-[.98] disabled:opacity-70 transition"
      >
        <GoogleG className="h-4 w-4" />
        <span className="hidden sm:inline">{busy ? "Ingresando…" : "Iniciar sesión"}</span>
        <span className="sm:hidden">{busy ? "…" : "Ingresar"}</span>
      </button>
    );
  }

  const isAdmin = !!user.email && ADMIN_EMAILS.includes(user.email);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-black/5 shadow-sm hover:brightness-95 active:scale-[.98] transition"
        title={user.displayName ?? user.email ?? "Cuenta"}
      >
        <img
          src={user.photoURL ?? "/avatar.svg"}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="px-3 py-2 text-sm text-slate-600">
            <div className="truncate font-medium text-slate-900">{user.displayName || user.email || "Usuario"}</div>
            {user.email && <div className="truncate text-xs text-slate-500">{user.email}</div>}
          </div>

          <div className="my-1 h-px bg-slate-200" />

          <MenuItem to={`/u/${user.uid}`}>Mi perfil</MenuItem>
          <MenuItem to="/notificaciones">Notificaciones</MenuItem>

          {isAdmin && (
            <>
              <div className="my-1 h-px bg-slate-200" />
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Admin
              </div>
              <MenuItem to="/admin/reports">Panel de reportes</MenuItem>
              <MenuItem to="/admin/metrics">Panel de métricas</MenuItem>
            </>
          )}

          <div className="my-1 h-px bg-slate-200" />

          <button
            onClick={() => logoutEverywhere({ hardReload: true })}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            role="menuitem"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function MenuItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
      {children}
    </Link>
  );
}

function GoogleG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden="true" {...props}>
      {/* ...paths iguales... */}
    </svg>
  );
}
