// src/services/threadReads.ts
import { db } from "@/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

const COL = "thread_reads";

const docId = (userId: string, threadId: string) => `${userId}_${threadId}`;

// Devuelve el último "lastReadAt" para ese usuario/hilo (o null si nunca ha leído)
export async function getLastReadAt(
  userId: string,
  threadId: string
): Promise<Timestamp | null> {
  const ref = doc(db, COL, docId(userId, threadId));
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data() as { lastReadAt?: Timestamp };
  return data.lastReadAt ?? null;
}

// Marca la lectura actual como "última lectura"
export async function touchLastRead(userId: string, threadId: string) {
  const ref = doc(db, COL, docId(userId, threadId));
  await setDoc(
    ref,
    {
      userId,
      threadId,
      lastReadAt: serverTimestamp(),
    },
    { merge: true }
  );
}
