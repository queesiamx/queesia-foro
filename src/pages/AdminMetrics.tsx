// src/pages/AdminMetrics.tsx
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import {
  getThreadsMetrics,
  getWeeklySummary,
  ThreadsMetrics,
  WeeklySummary,
} from "@/services/metrics";

import { BarChart2, MessageCircle, Eye, AlertTriangle } from "lucide-react";

const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

function AdminMetricsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<ThreadsMetrics | null>(null);
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (user) => {
      const email = user?.email ?? "";
      const allowed = ADMIN_EMAILS.includes(email);
      setIsAdmin(allowed);

      if (!allowed) {
        setLoading(false);
        return;
      }

      try {
        const [m, w] = await Promise.all([
          getThreadsMetrics(),
          getWeeklySummary(),
        ]);
        setMetrics(m);
        setWeekly(w);
      } catch (e) {
        console.error("Error cargando métricas:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => off();
  }, []);

  // Caso: logueado pero NO admin (se muestra card dentro del layout normal)
  if (isAdmin === false) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Acceso restringido
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Esta sección es solo para administradores del foro.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal (usa solo el navbar global de Layout)
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Encabezado bajo la barra fija del foro */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Panel de métricas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Resumen interno de actividad del foro: hilos, respuestas y vistas.
        </p>
      </header>

      {loading || !metrics ? (
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
      ) : (
        <>
          {/* Tarjetas principales */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Hilos totales
                </h2>
                <BarChart2 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {metrics.totalThreads}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Últimos 7 días: {metrics.threadsLast7Days}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Hilos resueltos / sin resolver
                </h2>
                <MessageCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {metrics.resolvedThreads}{" "}
                <span className="text-base font-normal text-slate-500">
                  resueltos
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.unresolvedThreads} sin resolver ·{" "}
                {metrics.unresolvedPct.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Participación
                </h2>
                <Eye className="h-4 w-4 text-sky-500" />
              </div>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                {metrics.avgRepliesPerThread.toFixed(1)} respuestas / hilo
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.avgViewsPerThread.toFixed(1)} vistas / hilo
              </p>
            </div>
          </div>

          {/* Bloque hilos sin respuesta */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Hilos sin respuesta
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {metrics.noReplyThreads} hilos sin ninguna respuesta ·{" "}
              {metrics.noReplyPct.toFixed(1)}% del total.
            </p>
          </section>

                      {/* Resumen semanal (reutilizable para newsletter) */}
            {weekly && (
              <section className="mt-6 grid gap-4 md:grid-cols-3">
                {/* Top hilos de la semana */}
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Top hilos de la semana
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {weekly.topThreads.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700"
                      >
                        <span className="flex-1 truncate font-medium">
                          {t.title}
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {t.replies} resp
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {t.views} vistas
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>

                {/* Hilos nuevos (7 días) */}
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Hilos nuevos (7 días)
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-700">
                    {weekly.newThreads.map((t) => (
                      <li
                        key={t.id}
                        className="truncate rounded-xl bg-slate-50 px-3 py-2"
                      >
                        {t.title}
                      </li>
                    ))}
                    {weekly.newThreads.length === 0 && (
                      <li className="text-xs text-slate-500">
                        No se han creado hilos nuevos en la última semana.
                      </li>
                    )}
                  </ul>
                </article>

                {/* Hilos sin respuesta (para impulsar) */}
                <article className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Hilos sin respuesta (para impulsar)
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-slate-700">
                    {weekly.unansweredThreads.map((t) => (
                      <li
                        key={t.id}
                        className="truncate rounded-xl bg-slate-50 px-3 py-2"
                      >
                        {t.title}
                      </li>
                    ))}
                    {weekly.unansweredThreads.length === 0 && (
                      <li className="text-xs text-slate-500">
                        No hay hilos pendientes de respuesta. 🎉
                      </li>
                    )}
                  </ul>
                </article>
              </section>
            )}

        </>
      )}
    </div>
  );
}

export default AdminMetricsPage;
