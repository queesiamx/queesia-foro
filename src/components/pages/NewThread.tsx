import { FormEvent, useState } from "react";
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp, type Firestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function NewThread() {
  if (!db) return <div>Firestore no configurado</div>;
  const DB = db as Firestore;

  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ref = await addDoc(collection(DB, "threads"), {
      title,
      content,
      createdAt: serverTimestamp(),
    });
    nav(`/thread/${ref.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
      <input className="border p-2 w-full rounded" placeholder="Título" value={title}
             onChange={(e) => setTitle(e.target.value)} required />
      <textarea className="border p-2 w-full rounded" placeholder="Contenido" value={content}
                onChange={(e) => setContent(e.target.value)} rows={6} />
      <button className="border px-4 py-2 rounded" type="submit">Crear</button>
    </form>
  );
}
