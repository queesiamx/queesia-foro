// src/components/Layout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const loc = useLocation();
  const showHeader = loc.pathname !== "/"; // oculta header en Home


  return (
    <div className="min-h-screen">
      {showHeader && (
        <header className="p-4 border-b flex gap-4">
          <Link to="/">Home</Link>
          <Link to="/threads">Hilos</Link>
          <Link to="/new">Nuevo</Link>
        </header>
      )}
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
