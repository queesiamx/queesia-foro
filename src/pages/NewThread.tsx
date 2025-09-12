import { useMemo, useState, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, Bold, Italic, Code, Hash, Paperclip, HelpCircle,
} from "lucide-react";

/** Opciones de categorías (mock) */
const CATEGORIES = [
  { id: "general", name: "General" },
  { id: "preguntas", name: "Preguntas" },
  { id: "recursos", name: "Recursos" },
  { id: "anuncios", name: "Anuncios" },
];

/** Render súper ligero de “markdown” (solo demo) */
function mdLight(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

export default function NewThread() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("ui, accesibilidad, rendimiento");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  const navigate = useNavigate();

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const titleOk = title.trim().length >= 3;
  const bodyOk = content.trim().length >= 10;
  const canCreate = titleOk && bodyOk;

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
    [tags]
  );

  const words = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content]
  );

  const addFormat = (kind: "bold" | "italic" | "code" | "tag") => {
    if (kind === "tag") {
      setTags((t) => (t.trim() ? t.trim() + ", nuevo-tag" : "nuevo-tag"));
      return;
    }
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart, selectionEnd, value } = ta;
    const sel = value.slice(selectionStart, selectionEnd) || "texto";
    let wrapped = sel;
    if (kind === "bold") wrapped = `**${sel}**`;
    if (kind === "italic") wrapped = `_${sel}_`;
    if (kind === "code") wrapped = `\`${sel}\``;
    const newVal = value.slice(0, selectionStart) + wrapped + value.slice(selectionEnd);
    setContent(newVal);
    // Recolocar el cursor al final del insert
    queueMicrotask(() => {
      ta.focus();
      const pos = selectionStart + wrapped.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validación mínima
  if (!title.trim() || !content.trim()) return;

  // Crear hilo en Firestore
  const ref = await addDoc(collection(db, "threads"), {
    title: title.trim(),
    body: content.trim(),
    category,                                   // si luego no la usas, puedes omitirla
    tags: tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 6),
    status: "published",                        // para que salga en el feed si filtras por status
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    locked: false,
    pinned: false,
    views: 0,
    repliesCount: 0,
  });

  // Ir al detalle del nuevo hilo
  navigate(`/thread/${ref.id}`);
};


  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header compacto */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Volver al foro
            </Link>
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-medium text-slate-900">Crear nuevo hilo</span>
            <span className="ml-auto hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs hover:bg-slate-50"
              >
                {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {preview ? "Ocultar preview" : "Ver preview"}
              </button>
              <button
                onClick={onSubmit}
                disabled={!canCreate}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${
                  canCreate ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Publicar
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Formulario */}
        <form onSubmit={onSubmit} className="lg:col-span-8 space-y-4">
          {/* Título */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="block text-sm font-medium text-slate-800">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Escribe un título claro y directo"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400"
            />
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Mín. 3 caracteres.</span>
              {!titleOk && <span className="text-amber-600">Aún muy corto</span>}
            </div>
          </div>

          {/* Metadatos */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800">Etiquetas (separadas por coma)</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ui, accesibilidad, rendimiento"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => addFormat("tag")}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                  title="Agregar tag rápido"
                >
                  <Hash className="h-4 w-4" />
                </button>
              </div>
              {!!tagList.length && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tagList.map((t) => (
                    <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contenido + Toolbar + Preview */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => addFormat("bold")}
                  className="rounded-md px-2 py-1 text-sm hover:bg-slate-100"
                  title="Negritas **texto**"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => addFormat("italic")}
                  className="rounded-md px-2 py-1 text-sm hover:bg-slate-100"
                  title="Cursivas _texto_"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => addFormat("code")}
                  className="rounded-md px-2 py-1 text-sm hover:bg-slate-100"
                  title="Código `snippet`"
                >
                  <Code className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                  title="Adjuntar (mock)"
                >
                  <Paperclip className="h-4 w-4" />
                  Adjuntar
                </button>
                <button
                  type="button"
                  onClick={() => setPreview((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {preview ? "Ocultar" : "Preview"}
                </button>
              </div>
            </div>

            <div className={`grid gap-0 ${preview ? "md:grid-cols-2" : ""}`}>
              <div className="p-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Contenido (formato ligero)
                </label>
                <textarea
                  ref={taRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe el detalle de tu publicación…"
                  className="h-[240px] w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Usa <b>**negritas**</b>, <i>_cursivas_</i>, <code>`código`</code>.
                  </span>
                  <span>
                    {words} palabras · mín. 10
                  </span>
                </div>
              </div>

              {preview && (
                <div className="border-t border-slate-200 md:border-l md:border-t-0 p-3">
                  <div className="mb-1 text-xs font-medium text-slate-500">Previsualización</div>
                  <div
                    className="prose prose-sm max-w-none rounded-lg border border-slate-200 bg-slate-50 p-3"
                    dangerouslySetInnerHTML={{ __html: mdLight(content || "_Escribe para ver la preview…_") }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Acciones inferiores */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 inline-flex items-center gap-1">
              <HelpCircle className="h-4 w-4" /> Pulsa <b>Ctrl</b> + <b>Enter</b> para crear
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={() => {
                  setTitle(""); setTags(""); setContent("");
                }}
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={!canCreate}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm ${
                  canCreate ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                Crear hilo
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sticky top-[88px]">
            <div className="q-gradient -mx-4 -mt-4 rounded-t-xl px-4 py-3 text-white">
              <div className="text-sm font-semibold">Sugerencias</div>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>Usa un <b>título descriptivo</b>.</li>
              <li>Incluye <b>contexto</b> y qué esperas obtener.</li>
              <li>Agrega <b>etiquetas</b> (máx. 6) para facilitar la búsqueda.</li>
              <li>Revisa la <b>previsualización</b> antes de publicar.</li>
            </ul>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              Esta es una vista de <b>prueba (mock)</b> para diseño.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
