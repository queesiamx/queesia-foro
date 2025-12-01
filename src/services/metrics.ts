// src/services/metrics.ts
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

type RawThread = {
  id: string;
  title?: string;
  status?: string;
  resolved?: boolean;
  bestPostId?: string;
  repliesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  views?: number;
  createdAt?: Date | Timestamp;
  lastActivityAt?: Date | Timestamp;
  category?: string;
};

export type ThreadsMetrics = {
  totalThreads: number;
  resolvedThreads: number;
  unresolvedThreads: number;
  unresolvedPct: number;
  noReplyThreads: number;
  noReplyPct: number;
  threadsLast7Days: number;
  avgRepliesPerThread: number;
  avgViewsPerThread: number;
};

export type WeeklySummary = {
  generatedAt: string;
  topThreads: {
    id: string;
    title: string;
    replies: number;
    views: number;
  }[];
  newThreads: {
    id: string;
    title: string;
  }[];
  unansweredThreads: {
    id: string;
    title: string;
  }[];
};

function toDate(d?: Date | Timestamp): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if ((d as any)?.toDate) return (d as Timestamp).toDate();
  try {
    return new Date(d as any);
  } catch {
    return null;
  }
}

export async function getThreadsMetrics(): Promise<ThreadsMetrics> {
  const ref = collection(db, "threads");
  const snap = await getDocs(ref);

  const threads: RawThread[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as any;
    threads.push({
      id: doc.id,
      ...data,
    });
  });

  const totalThreads = threads.length || 0;

  const isResolved = (t: RawThread) => {
    const status = (t.status ?? "").toLowerCase();
    return Boolean(
      t.bestPostId ||
        t.resolved === true ||
        status === "resolved" ||
        status === "resuelto"
    );
  };

  const repliesOf = (t: RawThread) =>
    Number(t.repliesCount ?? t.commentsCount ?? 0);
  const viewsOf = (t: RawThread) =>
    Number(t.viewsCount ?? t.views ?? 0);

  const resolvedThreads = threads.filter(isResolved).length;
  const unresolvedThreads = totalThreads - resolvedThreads;

  const noReplyThreads = threads.filter((t) => repliesOf(t) === 0).length;

  const unresolvedPct =
    totalThreads > 0 ? (unresolvedThreads / totalThreads) * 100 : 0;
  const noReplyPct =
    totalThreads > 0 ? (noReplyThreads / totalThreads) * 100 : 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const threadsLast7Days = threads.filter((t) => {
    const created = toDate(t.createdAt);
    if (!created) return false;
    return created >= sevenDaysAgo;
  }).length;

  const totalReplies = threads.reduce(
    (acc, t) => acc + repliesOf(t),
    0
  );
  const totalViews = threads.reduce(
    (acc, t) => acc + viewsOf(t),
    0
  );

  const avgRepliesPerThread =
    totalThreads > 0 ? totalReplies / totalThreads : 0;
  const avgViewsPerThread =
    totalThreads > 0 ? totalViews / totalThreads : 0;

  return {
    totalThreads,
    resolvedThreads,
    unresolvedThreads,
    unresolvedPct,
    noReplyThreads,
    noReplyPct,
    threadsLast7Days,
    avgRepliesPerThread,
    avgViewsPerThread,
  };
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  const ref = collection(db, "threads");
  const snap = await getDocs(ref);

  const threads: RawThread[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as any;
    threads.push({
      id: doc.id,
      ...data,
    });
  });

  const repliesOf = (t: RawThread) =>
    Number(t.repliesCount ?? t.commentsCount ?? 0);
  const viewsOf = (t: RawThread) =>
    Number(t.viewsCount ?? t.views ?? 0);

  // Top 5 hilos por actividad (replies + views)
  const topThreads = [...threads]
    .sort((a, b) => {
      const scoreA = repliesOf(a) * 3 + viewsOf(a);
      const scoreB = repliesOf(b) * 3 + viewsOf(b);
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title ?? "Sin título",
      replies: repliesOf(t),
      views: viewsOf(t),
    }));

  // Hilos nuevos (7 días)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThreads = threads
    .filter((t) => {
      const created = toDate(t.createdAt);
      return created && created >= sevenDaysAgo;
    })
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      title: t.title ?? "Sin título",
    }));

  // Hilos sin respuesta
  const unansweredThreads = threads
    .filter((t) => repliesOf(t) === 0)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      title: t.title ?? "Sin título",
    }));

  return {
    generatedAt: now.toISOString(),
    topThreads,
    newThreads,
    unansweredThreads,
  };
}
