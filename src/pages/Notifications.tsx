// src/pages/Notifications.tsx
// RTC_CO — Vista completa de notificaciones del foro

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/firebase";
import {
  watchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type ForumNotification,
} from "@/services/notifications";

// Reutilizamos el mismo formato de fecha que en NotificationBell
function formatDate(ts: any): string {
  if (!ts) return "";
  const d =
    ts instanceof Date
      ? ts
      : typeof ts.toDate === "function"
      ? ts.toDate()
      : null;

  if (!d) return "";

  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<ForumNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Quién está logueado
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUid(null);
        setItems([]);
        setLoading(false);
        // si quieres, mándalo al home:
        navigate("/");
      } else {
        setUid(user.uid);
      }
    });
    return () => off();
  }, [navigate]);

  // Escuchar notificaciones del usuario
  useEffect(() => {
    if (!uid) return;

    setLoading(true);
    const stop = watchUserNotifications(uid, (notifs) => {
      setItems(notifs);
      setLoading(false);
    });

    return () => stop && stop();
  }, [uid]);

  const unread = items.filter((n) => !n.read);
  const read = items.filter((n) => n.read);

  const handleOpenNotification = async (notif: ForumNotification) => {
    try {
      if (!notif.read) {
        await markNotificationAsRead(notif.id);
      }
    } catch (err) {
      console.error("Error marcando notificación como leída", err);
    }
    // La navegación la hace el <Link>
  };

  const handleMarkAll = async () => {
    if (!uid) return;
    try {
      await markAllNotificationsAsRead(uid);
    } catch (err) {
      console.error("Error marcando todas como leídas", err);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Notificaciones
          </h1>
          <p className="text-sm text-slate-500">
            Últimas actividades en tus hilos y respuestas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unread.length === 0}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Marcar todo como leído
        </button>
      </header>

      {/* Contenido */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Cargando notificaciones…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          No tienes notificaciones por ahora.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sección: Nuevas */}
          {unread.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">
                Nuevas
              </h2>
              <div className="space-y-2">
                {unread.map((n) => (
                  <Link
                    key={n.id}
                    to={n.threadId ? `/thread/${n.threadId}` : "#"}
                    onClick={() => handleOpenNotification(n)}
                    className="block rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 hover:bg-amber-50"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-900">
                        {n.fromUserName ?? "Alguien"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800">{n.message}</p>
                    {n.threadTitle && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                        En: <span className="font-medium">{n.threadTitle}</span>
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Sección: Leídas recientemente */}
          {read.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">
                Leídas recientemente
              </h2>
              <div className="space-y-2">
                {read.map((n) => (
                  <Link
                    key={n.id}
                    to={n.threadId ? `/thread/${n.threadId}` : "#"}
                    onClick={() => handleOpenNotification(n)}
                    className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-800">
                        {n.fromUserName ?? "Alguien"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{n.message}</p>
                    {n.threadTitle && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        En: <span className="font-medium">{n.threadTitle}</span>
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
