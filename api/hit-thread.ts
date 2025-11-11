// api/hit-thread.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dbAdmin, FieldValue } from "./_lib/admin";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const { threadId } = (req.body || {}) as { threadId?: string };
    if (!threadId) return res.status(400).json({ error: "threadId required" });

    await dbAdmin.collection("threads").doc(threadId).update({
      viewsCount: FieldValue.increment(1),
    });

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "internal error" });
  }
}
