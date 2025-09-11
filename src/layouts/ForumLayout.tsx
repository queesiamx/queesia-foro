import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ⬇️ Topbar eliminado */}
      {/* <header> ... </header> */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
