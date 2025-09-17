import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, requireSession } from "@/services/auth";
import type { Session } from "@/services/auth";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const nav = useNavigate();
  const loc = useLocation();
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;

    (async () => {
      const s = await getSession();
      setSession(s);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return <div className="p-4 text-sm text-slate-600">Comprobando sesión…</div>;
  }

  if (!session) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-slate-700">Necesitas iniciar sesión para continuar.</div>
        <button
          className="rounded-md bg-indigo-600 px-3 py-2 text-white text-sm hover:bg-indigo-700"
          onClick={async () => {
            const s = await requireSession();
            setSession(s);
            nav(loc.pathname + loc.search, { replace: true });
          }}
        >
          Acceder con Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
