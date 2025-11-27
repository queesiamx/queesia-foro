// src/services/reports.ts
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase";

export type ReportTargetType = "thread" | "post";
export type ReportStatus = "open" | "reviewed" | "closed";

export interface ForumReport {
  id?: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: string;
  userId: string;
  status: ReportStatus;
  createdAt?: any; // Timestamp de Firestore
}

/**
 * Crear un reporte de contenido (hilo o post)
 */
export async function createReport(params: {
  targetId: string;
  targetType: ReportTargetType;
  reason: string;
  userId: string;
}) {
  const { targetId, targetType, reason, userId } = params;

  const ref = collection(db, "reports");
  await addDoc(ref, {
    targetId,
    targetType,
    reason,
    userId,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

/**
 * Suscribirse a todos los reportes (para panel /admin/foro)
 * Solo debería usarse del lado admin.
 */
export function watchReports(
  onData: (reports: ForumReport[]) => void
) {
  const ref = collection(db, "reports");
  const q = query(ref, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snap) => {
    const items: ForumReport[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as Omit<ForumReport, "id">;
      items.push({
        id: doc.id,
        ...data,
      });
    });
    onData(items);
  });
}
