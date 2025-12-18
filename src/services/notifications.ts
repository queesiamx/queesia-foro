// src/services/notifications.ts
// Utilidades de notificaciones del foro

import emailjs from "@emailjs/browser";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
 import { db } from "@/firebase";


 const ADMIN_EMAILS = ["misaeltup@gmail.com", "amhjmixqui@gmail.com"];

 type NotifyAdminsArgs = {
   evento: string;
   mensaje_personalizado: string;
 };

 export async function notifyAdmins({ evento, mensaje_personalizado }: NotifyAdminsArgs) {
   const templateParamsBase = {
     nombre: "Equipo Queesia",
     evento, // 👈 tu variable nueva en el template
   };

    const sends = ADMIN_EMAILS.map((adminEmail) =>
    emailjs.send(
      "service_vdpzkm8",
      "template_n0pj59s",
      {
        ...templateParamsBase,
        email: adminEmail,
        mensaje_personalizado,
      },
      "9SxO0lF9IKHaknc4Q"
    )
  );

  const results = await Promise.allSettled(sends);
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    console.warn(`[notifyAdmins] fallaron ${failed.length}/${results.length} envíos`, failed);
  }
 }


export type ForumNotification = {
  id: string;
  userId: string;          // destinatario
  type: "reply" | "like";  // puedes extender: "follow", etc.
  threadId?: string | null;
  postId?: string | null;
  message: string;
  createdAt?: Timestamp | Date | null;
  read?: boolean;
  fromUserId?: string | null;
  fromUserName?: string | null;
  threadTitle?: string | null;
};

// ----------------------------- Creación -----------------------------

type CreateReplyNotificationInput = {
  threadId: string;
  threadTitle: string;
  threadAuthorId: string;  // destinatario
  replierId: string;
  replierName: string;
};

export async function createReplyNotification(
  input: CreateReplyNotificationInput
) {
  if (!db) return;
  const {
    threadId,
    threadTitle,
    threadAuthorId,
    replierId,
    replierName,
  } = input;

  // No notificar si el autor responde en su propio hilo
  if (threadAuthorId === replierId) return;

  const colRef = collection(db, "notifications");

  await addDoc(colRef, {
    userId: threadAuthorId,
    type: "reply",
    threadId,
    postId: null,
    message: `${replierName} respondió en tu hilo "${threadTitle}".`,
    createdAt: serverTimestamp(),
    read: false,
    fromUserId: replierId,
    fromUserName: replierName,
    threadTitle,
  });
}

type CreateLikeNotificationInput = {
  userId: string;      // destinatario (autor del post)
  threadId: string;
  postId: string;
  fromUserId: string;
  fromUserName: string;
  threadTitle?: string | null;
};

export async function createLikeNotification(input: CreateLikeNotificationInput) {
  if (!db) return;
  const { userId, threadId, postId, fromUserId, fromUserName, threadTitle } =
    input;

  if (userId === fromUserId) return;

  const colRef = collection(db, "notifications");

  await addDoc(colRef, {
    userId,
    type: "like",
    threadId,
    postId,
    message: `${fromUserName} le dio like a tu respuesta.`,
    createdAt: serverTimestamp(),
    read: false,
    fromUserId,
    fromUserName,
    threadTitle: threadTitle ?? null,
  });
}

// -------------------------- Lectura / watchers ----------------------

// 🔢 contador de no leídas
export function watchUnreadNotifications(
  userId: string,
  cb: (count: number) => void
) {
  if (!db) return () => {};

  const colRef = collection(db, "notifications");
  const qUnread = query(
    colRef,
    where("userId", "==", userId),
    where("read", "==", false)
  );

  return onSnapshot(qUnread, (snap) => {
    cb(snap.size);
  });
}

// 📋 últimas notificaciones (leídas + no leídas)
export function watchUserNotifications(
  userId: string,
  cb: (items: ForumNotification[]) => void
) {
  if (!db) return () => {};

  const colRef = collection(db, "notifications");
  const qAll = query(
    colRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(qAll, (snap) => {
    const list: ForumNotification[] = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        userId: data.userId,
        type: data.type,
        threadId: data.threadId ?? null,
        postId: data.postId ?? null,
        message: data.message ?? "",
        createdAt: data.createdAt ?? null,
        read: data.read ?? false,
        fromUserId: data.fromUserId ?? null,
        fromUserName: data.fromUserName ?? null,
        threadTitle: data.threadTitle ?? null,
      };
    });
    cb(list);
  });
}

// -------------------------- Marcar como leídas ----------------------

export async function markNotificationAsRead(id: string) {
  if (!db) return;
  const ref = doc(db, "notifications", id);
  await updateDoc(ref, { read: true });
}

export async function markAllNotificationsAsRead(userId: string) {
  if (!db) return;

  const colRef = collection(db, "notifications");
  const qUnread = query(
    colRef,
    where("userId", "==", userId),
    where("read", "==", false)
  );

  const snap = await getDocs(qUnread);
  if (snap.empty) return;

  const updates = snap.docs.map((d) =>
    updateDoc(doc(db, "notifications", d.id), { read: true })
  );
  await Promise.all(updates);
}
