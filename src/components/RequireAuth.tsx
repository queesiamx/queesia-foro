import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, loginWithGoogle } from "@/services/auth";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const [state, setState] = useState<"checking" | "ok" | "no">("checking");
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    getSession()
      .then((s) => alive && setState(s ? "ok" : "no")) // << s, no r.user
      .catch(() => alive && setState("no"));
    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") {
    return <div className="p-4 text-sm text-slate-600">Comprobando sesión…</div>;
  }

  if (state === "no") {
    // Abre Google y vuelve a la misma URL cuando termine
    loginWithGoogle()
      .then(() => nav(loc.pathname + loc.search, { replace: true }))
      .catch(() => nav("/", { replace: true }));
    return <div className="p-4 text-sm">Redirigiendo a login…</div>;
  }

  return <>{children}</>;
}
