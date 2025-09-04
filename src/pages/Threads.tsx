import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query, Timestamp, type Firestore } from "firebase/firestore";
import { Link } from "react-router-dom";

type ThreadDoc = { id: string; title: string; content?: string; createdAt?: Timestamp };

export default function Threads() {
  if (!db) return <div>Firestore no configurado</div>;   // 👈 guard a nivel componente
  const DB = db as Firestore;                             // 👈 fija el tipo

  const [items, setItems] = useState<ThreadDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(DB, "threads"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ThreadDoc, "id">) }));
      setItems(rows);
      setLoading(false);
    };
    load().catch(console.error);
  }, [DB]);

  if (loading) return <div>Cargando…</div>;

  return (
    <div className="space-y-2">
      {items.length === 0 && <div>No hay hilos aún.</div>}
      {items.map((t) => (
        <div key={t.id} className="border p-3 rounded">
          <Link to={`/thread/${t.id}`} className="font-semibold underline">
            {t.title || "(sin título)"}
          </Link>
        </div>
      ))}
    </div>
  );
}
