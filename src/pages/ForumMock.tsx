import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSidebarCounts } from "@/services/forum";
import { 
  Search, Plus, MessageSquare, Eye, Tag, Clock, Pin, CheckCircle2, ChevronDown, Filter, Users
} from "lucide-react";
import { motion } from "framer-motion";
import TrendingReal from "@/components/TrendingReal";
// RTC-CO (Home.tsx – imports)
import UserMenu from "@/components/UserMenu";

// --- Mock data ---
const CATEGORIES = [
  { id: "all", name: "Todas", color: "bg-slate-200 text-slate-700" },
  { id: "anuncios", name: "Anuncios", color: "bg-amber-100 text-amber-800" },
  { id: "general", name: "General", color: "bg-indigo-100 text-indigo-800" },
  { id: "preguntas", name: "Preguntas", color: "bg-emerald-100 text-emerald-800" },
  { id: "recursos", name: "Recursos", color: "bg-cyan-100 text-cyan-800" },
];

const THREADS = [
  { id: 1, title: "¿Cómo integro Firebase Auth con Vite + React sin romper el routing?",
    excerpt: "Estoy migrando a un microproyecto y quiero mantener sesiones limpias y un modal de login...",
    author: { name: "Misael", handle: "@misa", avatar: null },
    createdAt: "hace 2 h", lastActivity: { by: "Carla", when: "hace 10 min" },
    category: "preguntas", tags: ["firebase","vite","auth"], pinned: true, solved: false, replies: 12, views: 425 },
  { id: 2, title: "Guía visual de estilos para el foro (v1)",
    excerpt: "Colores, espaciados, radios y componentes base para que el foro se parezca al mock.",
    author: { name: "Equipo Queesia", handle: "@core", avatar: null },
    createdAt: "ayer", lastActivity: { by: "Leo", when: "hace 3 h" },
    category: "anuncios", tags: ["ui","tailwind"], pinned: true, solved: true, replies: 8, views: 980 },
  { id: 3, title: "Colecciones y reglas para Comentarios, Likes y Reportes",
    excerpt: "Estructura mínima en Firestore para lanzar rápido: experts, comments, likes, reports...",
    author: { name: "Nora", handle: "@noradev", avatar: null },
    createdAt: "hace 3 días", lastActivity: { by: "Raúl", when: "hace 1 h" },
    category: "recursos", tags: ["firestore","reglas","seguridad"], pinned: false, solved: true, replies: 17, views: 2210 },
  { id: 4, title: "[Ayuda] Sombra amarilla debajo de la navbar: ¿de dónde sale?",
    excerpt: "Ya revisé el layout y el tailwind.config, pero aparece una franja amarilla misteriosa...",
    author: { name: "Tupeck", handle: "@tupeck", avatar: null },
    createdAt: "hace 5 días", lastActivity: { by: "Majo", when: "hace 30 min" },
    category: "general", tags: ["debug","css"], pinned: false, solved: false, replies: 4, views: 310 },
];

const CatChip = ({ id }: { id: string }) => {
  const cat = CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
      <Tag className="h-3 w-3" /> {cat.name}
    </span>
  );
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-500":"bg-slate-300"}`}
    aria-pressed={checked}>
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5":"translate-x-1"}`} />
  </button>
);

const threadsFilterSort = (
  threads: typeof THREADS, q: string, category: string, onlySolved: boolean,
  sort: "recientes" | "populares" | "sinrespuesta"
) => {
  let list = [...threads];
  if (category !== "all") list = list.filter((t) => t.category === category);
  if (onlySolved) list = list.filter((t) => t.solved);
  if (q.trim()) {
    const z = q.toLowerCase();
    list = list.filter((t) =>
      t.title.toLowerCase().includes(z) ||
      t.excerpt.toLowerCase().includes(z) ||
      t.tags.some((x) => x.toLowerCase().includes(z))
    );
  }
  switch (sort) {
    case "populares": list.sort((a,b) => b.views - a.views); break;
    case "sinrespuesta": list.sort((a,b) => a.replies - b.replies); break;
    default: list.sort((a,b) => Number(b.pinned) - Number(a.pinned) || b.id - a.id);
  }
  return list;
};

// --- UI pieces ---
function Navbar({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-bold">Q</div>
          <div>
            <div className="text-sm uppercase tracking-wider text-slate-500">Queesia</div>
            <div className="-mt-1 text-base font-semibold text-slate-800">Foro</div>
          </div>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to="/">Inicio</Link>
          <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to="/feed">Categorías</Link>
            <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to="/reglas">
    Reglas
  </Link>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCreate}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white bg-brand-grad-rev hover:brightness-95"> <Plus className="h-4 w-4" /> Crear tema
          </button>
  
            <UserMenu />
        </div>
      </div>
    </div>
  );
}

function FiltersBar({
  q, setQ, category, setCategory, onlySolved, setOnlySolved, sort, setSort,
}: {
  q: string; setQ: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  onlySolved: boolean; setOnlySolved: (v: boolean) => void;
  sort: "recientes" | "populares" | "sinrespuesta"; setSort: (v: "recientes" | "populares" | "sinrespuesta") => void;
}) {
  return (
    <div className="sticky top-[60px] z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar temas, etiquetas o autores..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400" />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-indigo-400">
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="h-6 w-px bg-slate-200" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <Toggle checked={onlySolved} onChange={() => setOnlySolved(!onlySolved)} />
              Solo resueltos
            </label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Ordenar:</span>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 focus:border-indigo-400">
              <option value="recientes">Recientes</option>
              <option value="populares">Populares</option>
              <option value="sinrespuesta">Sin respuesta</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadCard({ t }: { t: (typeof THREADS)[number] }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-semibold">
          {t.author.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {t.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Pin className="h-3 w-3" /> Fijado</span>}
            {t.solved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-3 w-3" /> Resuelto</span>}
            <CatChip id={t.category} />
          </div>
        <Link to="/feed" className="mt-2 block truncate text-lg font-semibold text-slate-900 hover:underline">
            {t.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t.author.name} <span className="text-slate-400">·</span> {t.createdAt}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Última act.: {t.lastActivity.by} · {t.lastActivity.when}</span>
            <div className="hidden h-3 w-px bg-slate-200 sm:block" />
            <div className="flex flex-wrap items-center gap-1">
              {t.tags.map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-700">#{tag}</span>)}
            </div>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
            <MessageSquare className="h-3.5 w-3.5" /> {t.replies}
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
            <Eye className="h-3.5 w-3.5" /> {t.views}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

    function Sidebar({ onCreate }: { onCreate: () => void }) {
        const [counts, setCounts] = useState<{
        trending: number; recientes: number; populares: number;
        preguntas: number; tutoriales: number;
      } | null>(null);

      useEffect(() => {
        getSidebarCounts().then(setCounts).catch(console.error);
      }, []);


  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">¿Tienes una duda o recurso?</h3>
        <p className="mt-1 text-sm text-slate-600">Publica un tema y la comunidad te apoya. Mantén un tono cordial y comparte contexto.</p>
        <button onClick={onCreate}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Crear tema
        </button>
      </div>

        {/* Estadísticas reales (Firestore) */}
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-900">Estadísticas</h3>
    {counts ? (
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        <li>Temas activos: <b>{counts.trending}</b></li>
        <li>Recientes (7 días): <b>{counts.recientes}</b></li>
        <li>Populares: <b>{counts.populares}</b></li>
        <li>Preguntas: <b>{counts.preguntas}</b></li>
        <li>Tutoriales: <b>{counts.tutoriales}</b></li>
      </ul>
    ) : (
      <div className="mt-3 h-16 rounded-lg bg-slate-50 animate-pulse" />
    )}
  </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Categorías</h3>
        <div className="mt-3 space-y-2">
          {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${c.color.split(" ")[0]}`} />
                <span className="text-sm text-slate-700">{c.name}</span>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{Math.floor(Math.random() * 40) + 3}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Tops de la semana</h3>
        <ul className="mt-3 space-y-3">
          {["Misael","Nora","Carla","Leo"].map((u,i) => (
            <li key={u} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold">{u[0]}</div>
                <span className="text-sm text-slate-700">{u}</span>
              </div>
              <span className="text-xs text-slate-500">{(10 - i) * 3} pts</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Reglas rápidas</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Respeto y claridad en los títulos.</li>
          <li>Comparte código, capturas y contexto.</li>
          <li>Marca como <span className="font-medium text-emerald-700">Resuelto</span> cuando apliques una solución.</li>
        </ul>
      </div>
    </div>
  );
}

function ForumMock() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [onlySolved, setOnlySolved] = useState(false);
  const [sort, setSort] = useState<"recientes" | "populares" | "sinrespuesta">("recientes");

  const filtered = useMemo(() => threadsFilterSort(THREADS, q, category, onlySolved, sort), [q, category, onlySolved, sort]);
  const nav = useNavigate();
  const handleCreate = () => nav("/nuevo");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onCreate={handleCreate} />
      <FiltersBar
        q={q} setQ={setQ}
        category={category} setCategory={setCategory}
        onlySolved={onlySolved} setOnlySolved={setOnlySolved}
        sort={sort} setSort={setSort}
      />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8 xl:col-span-9">
          {filtered.map((t) => <ThreadCard key={t.id} t={t} />)}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <span>Mostrando <b>{Math.min(filtered.length, 10)}</b> de <b>{filtered.length}</b></span>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Anterior</button>
              <button className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50">Siguiente</button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Bloque REAL desde Firestore */}
          <TrendingReal title="Ahora mismo en la comunidad" pageSize={3} />

          {/* Tus widgets mock tal cual */}
          <Sidebar onCreate={handleCreate} />
        </aside>

      </main>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Queesia · Comunidad</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-700">Privacidad</a>
            <a href="#" className="hover:text-slate-700">Términos</a>
            <a href="https://queesia.com/contacto" className="hover:text-slate-700">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ForumMock;
