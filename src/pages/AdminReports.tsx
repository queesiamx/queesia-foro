// src/pages/AdminReports.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { Link } from "react-router-dom";


type Report = {
  id: string;
  targetId: string;
  targetType: "thread" | "post";
  reason: string;
  userId: string;
  status: string;
  createdAt?: any; // Timestamp
};

const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const user = auth.currentUser;
  const isAdminEmail =
    !!user && ADMIN_EMAILS.includes(user.email ?? "");

  // Si no es admin por correo, no intentamos ni leer Firestore
  useEffect(() => {
    if (!db || !isAdminEmail) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

    const off = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Report[];
      setReports(data);
      setLoading(false);
    });

    return () => off();
  }, [isAdminEmail]);

  const formatDate = (ts: any) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : ts;
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      setUpdatingId(reportId);
      await updateDoc(doc(db, "reports", reportId), {
        status: newStatus,
      });
    } catch (err) {
      console.error("Error actualizando status del reporte:", err);
      alert("No se pudo actualizar el estado del reporte.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Mensaje si NO es de los correos admin
  if (!isAdminEmail) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-600">
        No tienes permisos para ver esta sección.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Panel de reportes
      </h1>
      <p className="text-sm text-slate-600">
        Aquí ves todos los reportes de hilos y respuestas. Solo tú (admin) puedes
        acceder, gracias a las reglas de Firestore.
      </p>

            <div className="flex items-center justify-between gap-2 pt-2">
        <p className="text-xs text-slate-500">
          Usa este panel para revisar el contenido marcado por la comunidad.
        </p>

        <Link
          to="/admin/metrics"
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
        >
          Ver métricas del foro
        </Link>
      </div>


      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          Cargando reportes…
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          No hay reportes por revisar. 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-800">
                  {r.targetType === "thread" ? "Hilo" : "Respuesta"} reportado
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    r.status === "pending" || r.status === "open"
                      ? "bg-amber-100 text-amber-800"
                      : r.status === "closed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  Estado: {r.status}
                </span>
              </div>

              <div className="mt-2 text-slate-600">
                <p className="mb-1">
                  <span className="font-medium">Motivo:</span> {r.reason}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Contenido:</span>{" "}
                  <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                    {r.targetType}:{r.targetId}
                  </code>
                </p>
                <p className="mb-1 text-xs text-slate-500">
                  Reportado por: <code>{r.userId}</code>
                </p>
                <p className="mb-1 text-xs text-slate-500">
                  Fecha: {formatDate(r.createdAt)}
                </p>

                {r.targetType === "thread" && (
                  <a
                    href={`/thread/${r.targetId}`}
                    className="mt-1 inline-flex text-xs text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir hilo en nueva pestaña ↗
                  </a>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(r.id, "open")}
                  disabled={updatingId === r.id}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  Marcar como pendiente
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(r.id, "reviewed")}
                  disabled={updatingId === r.id}
                  className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
                >
                  En revisión
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(r.id, "closed")}
                  disabled={updatingId === r.id}
                  className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  Cerrar reporte
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
