import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, type Firestore } from "firebase/firestore";

type T = { title: string; content?: string };

export default function Thread() {
  const { id } = useParams();
  if (!id) return <div>Sin id</div>;
  if (!db) return <div>Firestore no configurado</div>;
  const DB = db as Firestore;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const snap = await getDoc(doc(DB, "threads", id));
      setData(snap.exists() ? (snap.data() as T) : null);
      setLoading(false);
    };
    run().catch(console.error);
  }, [DB, id]);

  if (loading) return <div>Cargando…</div>;
  if (!data) return <div>Hilo no encontrado</div>;
  return (
    <article className="space-y-2">
      <h1 className="text-xl font-bold">{data.title}</h1>
      <p>{data.content}</p>
    </article>
  );
}
