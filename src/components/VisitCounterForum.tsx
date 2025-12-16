import { useEffect, useState } from "react";
import { trackForumVisitOncePerDay, listenForumVisits } from "@/scripts/trackForumVisit";

export default function VisitCounterForum() {
  const [visitas, setVisitas] = useState<number | null>(null);

  useEffect(() => {
    const offAuth = trackForumVisitOncePerDay();
    const offSnap = listenForumVisits((n) => setVisitas(n));
    return () => {
      offAuth && offAuth();
      offSnap && offSnap();
    };
  }, []);

  const fmt = (n: number | null) => new Intl.NumberFormat("es-MX").format(n ?? 0);

  return (
    <p className="mt-2 text-xs text-slate-500">
  Visitas totales: <b className="text-slate-700">{visitas == null ? "..." : fmt(visitas)}</b>
</p>

  );
}
