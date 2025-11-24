// src/components/NotificationBell.tsx
// Campanita de notificaciones con popover simple

import React, { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";

import { auth } from "@/firebase";
import {
  watchUnreadNotifications,
  watchUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,   // RTC_CO — nuevo helper
  type ForumNotification,
} from "@/services/notifications";


function formatDate(ts?: any) {
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

export default function NotificationBell() {
  const [uid, setUid] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<ForumNotification[]>([]);
  const [open, setOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Escucha de auth + notificaciones
  useEffect(() => {
    let stopCount: (() => void) | null = null;
    let stopList: (() => void) | null = null;

    const stopAuth = onAuthStateChanged(auth, (user) => {
      // Limpia listeners previos
      if (stopCount) {
        stopCount();
        stopCount = null;
      }
      if (stopList) {
        stopList();
        stopList = null;
      }

      if (!user) {
        setUid(null);
        setUnread(0);
        setItems([]);
        return;
      }

      const u = user.uid;
      setUid(u);

      stopCount = watchUnreadNotifications(u, (n) => setUnread(n));
      stopList = watchUserNotifications(u, (list) => setItems(list));
    });

    return () => {
      stopAuth();
      if (stopCount) stopCount();
      if (stopList) stopList();
    };
  }, []);

  // Cerrar popover al hacer clic fuera
  useEffect(() => {
    if (!open) return;

    const handler = (ev: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!uid) {
    // Si no hay usuario logueado, no mostramos nada (o podrías mostrar una campanita desactivada)
    return null;
  }

  // RTC_CO — al abrir el popover, marcar todas como leídas
  const handleToggle = async () => {
    if (!uid) return;

    const next = !open;
    setOpen(next);

    if (next) {
      try {
        await markAllNotificationsAsRead(uid);
      } catch (err) {
        console.error(
          "Error marcando todas las notificaciones como leídas",
          err
        );
      }
    }
  };


  const handleClickNotification = async (notif: ForumNotification) => {
    try {
      if (!notif.read) {
        await markNotificationAsRead(notif.id);
      }
    } catch (err) {
      console.error("Error marcando notificación como leída", err);
    } finally {
      // dejamos que el <Link> haga la navegación; no cerramos forzosamente
      setOpen(false);
    }
  };

  const unreadBadge = unread > 9 ? "9+" : unread.toString();

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón de campana */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
            {unreadBadge}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg z-50">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">
              Notificaciones
            </p>
            <p className="text-xs text-slate-500">
              Últimas actividades en tus hilos y respuestas.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">
              No tienes notificaciones por ahora.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.threadId ? `/thread/${n.threadId}` : "#"}
                    onClick={() => handleClickNotification(n)}
                    className={`flex flex-col gap-1 px-3 py-2 text-sm hover:bg-slate-50 ${
                      n.read ? "text-slate-500" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {n.fromUserName ?? "Alguien"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-2">{n.message}</p>
                    {n.threadTitle && (
                      <p className="text-[11px] text-slate-400">
                        En: <span className="italic">{n.threadTitle}</span>
                      </p>
                    )}
                    {!n.read && (
                      <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                        • Nuevo
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
