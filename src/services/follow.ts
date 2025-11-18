import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "@/firebase";

const COL = "thread_follows";

export async function isFollowing(userId: string, threadId: string) {
  const q = query(collection(db, COL),
    where("userId", "==", userId),
    where("threadId", "==", threadId));
  const snap = await getDocs(q);
  return snap.docs[0] ?? null;
}

export async function toggleFollow(userId: string, threadId: string) {
  const existing = await isFollowing(userId, threadId);
  if (existing) {
    await deleteDoc(existing.ref);
    return { following: false };
  }
  await addDoc(collection(db, COL), { userId, threadId, createdAt: serverTimestamp() });
  return { following: true };
}

export function watchFollowCount(threadId: string, cb: (n:number)=>void) {
  const q = query(collection(db, COL), where("threadId", "==", threadId));
  return onSnapshot(q, (snap) => cb(snap.size));
}

export function watchIsFollowing(userId:string, threadId:string, cb:(v:boolean)=>void) {
  const q = query(collection(db, COL),
    where("userId","==",userId),
    where("threadId","==",threadId));
  return onSnapshot(q, (snap) => cb(!snap.empty));
}

// ...

/**
 * Observa todos los hilos que sigue un usuario.
 * Llama a cb con un arreglo de IDs de hilo.
 */
export function watchUserFollowedThreads(
  userId: string,
  cb: (threadIds: string[]) => void
) {
  const q = query(
    collection(db, "thread_follows"),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snap) => {
    const ids = snap.docs
      .map((doc) => {
        const data = doc.data() as any;
        return data.threadId as string;
      })
      .filter(Boolean);
    cb(ids);
  });
}
