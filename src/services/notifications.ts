// src/services/notifications.ts
// Servicio de notificaciones del foro (RTC_CO)

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  getDocs,        // 👈 agrega este
} from "firebase/firestore";
import { db } from "@/firebase";

// -------------------- Tipos --------------------

export type ForumNotification = {
  id: string;
  userId: string;          // destinatario
  fromUserId: string;      // quien la genera
  fromUserName?: string;
  type: string;            // 'reply', 'like', etc.
  threadId?: string;
  threadTitle?: string;
  postId?: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp;
};

const COL = "notifications";

// -------------------- Helpers internos --------------------

function mapSnapToNotification(snap: any): ForumNotification {
  const data = snap.data() || {};
  return {
    id: snap.id,
    userId: data.userId,
    fromUserId: data.fromUserId,
    fromUserName: data.fromUserName,
    type: data.type,
    threadId: data.threadId,
    threadTitle: data.threadTitle,
    postId: data.postId,
    message: data.message,
    read: !!data.read,
    createdAt: data.createdAt,
  };
}

// -------------------- Creación genérica --------------------

type BaseNotificationPayload = {
  userId: string;          // destinatario
  type: string;
  threadId?: string;
  threadTitle?: string;
  postId?: string;
  message: string;
};

export async function sendNotification(
  payload: BaseNotificationPayload & {
    fromUserId: string;
    fromUserName?: string | null;
  }
) {
  if (!db) return;

  await addDoc(collection(db, COL), {
    userId: payload.userId,              // destinatario
    fromUserId: payload.fromUserId,      // quien la genera
    fromUserName: payload.fromUserName ?? null,
    type: payload.type,
    threadId: payload.threadId ?? null,
    threadTitle: payload.threadTitle ?? null,
    postId: payload.postId ?? null,
    message: payload.message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

// -------------------- Caso específico: respuesta en hilo --------------------

type ReplyNotificationParams = {
  threadId: string;
  threadTitle: string;
  threadAuthorId: string;   // destinatario
  replierId: string;        // quien responde
  replierName?: string | null;
};

export async function createReplyNotification(params: ReplyNotificationParams) {
  return sendNotification({
    userId: params.threadAuthorId,
    fromUserId: params.replierId,
    fromUserName: params.replierName ?? null,
    type: "reply",
    threadId: params.threadId,
    threadTitle: params.threadTitle,
    message: `${params.replierName ?? "Alguien"} respondió en “${
      params.threadTitle || "un hilo"
    }”.`,
  });
}

// -------------------- Lectura en tiempo real --------------------

// Solo el contador de no leídas
export function watchUnreadNotifications(
  userId: string,
  cb: (count: number) => void
) {
  if (!db) return () => {};

  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    where("read", "==", false)
  );

  return onSnapshot(
    q,
    (snap) => cb(snap.size),
    (err) => {
      console.error("[notifications] error en watchUnreadNotifications", err);
      cb(0);
    }
  );
}

// Lista de últimas notificaciones (leídas y no leídas)
export function watchUserNotifications(
  userId: string,
  cb: (items: ForumNotification[]) => void
) {
  if (!db) return () => {};

  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map(mapSnapToNotification);
      cb(items);
    },
    (err) => {
      console.error("[notifications] error en watchUserNotifications", err);
      cb([]);
    }
  );
}

// -------------------- Marcar como leída --------------------

export async function markNotificationAsRead(id: string) {
  if (!db || !id) return;
  const ref = doc(db, COL, id);
  await updateDoc(ref, { read: true });
}

// RTC_CO — Marcar TODAS las notificaciones de un usuario como leídas
export async function markAllNotificationsAsRead(userId: string) {
  if (!db || !userId) return;

  // Solo las que están pendientes (read == false)
  const q = query(
    collection(db, COL),
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  const ops = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(ops);
}
