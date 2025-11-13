import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSidebarCounts, watchTrendingThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";
import Footer from "@/components/Footer";
import {
  Search,
  Plus,
  MessageSquare,
  Eye,
  Tag,
  Clock,
  Pin,
  CheckCircle2,
  ChevronDown,
  Filter,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import NowWidget from "@/components/NowWidget";
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

const CatChip = ({ id }: { id: string }) => {
  const cat = CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}
    >
      <Tag className="h-3 w-3" /> {cat.name}
    </span>
  );
};

const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? "bg-emerald-500" : "bg-slate-300"
    }`}
    aria-pressed={checked}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

// ---------- Tipo para la tarjeta que renderiza ThreadCard ----------
type CardData = {
  id: string | number;
  title: string;
  excerpt: string;
  author: { name: string; handle?: string; avatar?: string | null };
  createdAt: string;
  lastActivity: { by: string; when: string };
  category: string;
  tags: string[];
  pinned: boolean;
  solved: boolean;
  replies: number;
  views: number;
};

// --- UI pieces ---
function Navbar({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-bold">
            Q
          </div>
          <div>
            <div className="text-sm uppercase tracking-wider text-slate-500">
              Queesia
            </div>
            <div className="-mt-1 text-base font-semibold text-slate-800">
              Foro
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to="/">
            Inicio
          </Link>
          <Link className="text-sm font-medium text-slate-700 hover:text-slate-900" to="/reglas">
            Reglas
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white bg-brand-grad-rev hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Crear tema
          </button>

          <UserMenu />
        </div>
      </div>
    </div>
  );
}

function FiltersBar({
  q,
  setQ,
  category,
  setCategory,
  onlySolved,
  setOnlySolved,
  sort,
  setSort,
}: {
  q: string;
  setQ: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  onlySolved: boolean;
  setOnlySolved: (v: boolean) => void;
  sort: "recientes" | "populares" | "sinrespuesta";
  setSort: (v: "recientes" | "populares" | "sinrespuesta") => void;
}) {
  return (
    <div className="sticky top-[60px] z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar temas, etiquetas o autores..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400"
            />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 focus:border-indigo-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 focus:border-indigo-400"
            >
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

// Reemplaza TODO el componente por esta versión
function ThreadCard({ t }: { t: CardData }) {
  const threadHref = `/thread/${encodeURIComponent(String(t.id))}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-semibold">
          {t.author.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {t.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <Pin className="h-3 w-3" /> Fijado
              </span>
            )}
            {t.solved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Resuelto
              </span>
            )}
            <CatChip id={t.category} />
          </div>

          {/* ⬇️ AQUI el cambio: /thread/:id (antes estaba /feed) */}
    <Link
      to={threadHref}  // ⬅️ antes era "/feed"
      className="mt-2 block truncate text-lg font-semibold text-slate-900 hover:underline"
    >
      {t.title}
    </Link>

          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.excerpt}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {t.author.name} <span className="text-slate-400">·</span> {t.createdAt}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Última act.: {t.lastActivity.by} · {t.lastActivity.when}
            </span>
            <div className="hidden h-3 w-px bg-slate-200 sm:block" />
            <div className="flex flex-wrap items-center gap-1">
              {(t.tags ?? []).map((tag, i) => (
            <span key={`${tag}-${i}`} className="rounded-md bg-slate-100 px-1.5 py-0.5">
              #{tag}
            </span>
          ))}

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

      {/* (Opcional) Haz toda la tarjeta clickeable sin romper los botones internos */}
      {/* <Link to={threadHref} className="absolute inset-0" aria-label={t.title} /> */}
    </motion.div>
  );
}


function Sidebar({ onCreate }: { onCreate: () => void }) {
  const [counts, setCounts] = useState<{
    trending: number;
    recientes: number;
    populares: number;
    preguntas: number;
    tutoriales: number;
  } | null>(null);

  useEffect(() => {
    getSidebarCounts().then(setCounts).catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">¿Tienes una duda o recurso?</h3>
        <p className="mt-1 text-sm text-slate-600">
          Publica un tema y la comunidad te apoya. Mantén un tono cordial y comparte contexto.
        </p>
        <button
          onClick={onCreate}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Crear tema
        </button>
      </div>

      {/* Estadísticas reales (Firestore) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Estadísticas</h3>
        {counts ? (
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>
              Temas activos: <b>{counts.trending}</b>
            </li>
            <li>
              Recientes (7 días): <b>{counts.recientes}</b>
            </li>
            <li>
              Populares: <b>{counts.populares}</b>
            </li>
            <li>
              Preguntas: <b>{counts.preguntas}</b>
            </li>
            <li>
              Tutoriales: <b>{counts.tutoriales}</b>
            </li>
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
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {Math.floor(Math.random() * 40) + 3}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Tops de la semana</h3>
        <ul className="mt-3 space-y-3">
          {["Misael", "Nora", "Carla", "Leo"].map((u, i) => (
            <li key={u} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold">
                  {u[0]}
                </div>
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
          <li>
            Marca como <span className="font-medium text-emerald-700">Resuelto</span> cuando
            apliques una solución.
          </li>
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

  // ===== Realtime desde Firestore =====
  const [items, setItems] = useState<Thread[]>([]);
  useEffect(() => {
    // Trae hilos vivos (sube pageSize si quieres más)
    const off = watchTrendingThreads(setItems, { pageSize: 50 });
    return off;
  }, []);

  // Pequeño "hace X h/d" para fechas
  function ago(ts?: any) {
    try {
      const d = (ts?.toDate?.() ?? ts) as Date;
      const ms = Date.now() - new Date(d).getTime();
      const h = Math.max(1, Math.floor(ms / 36e5));
      if (h < 24) return `hace ${h} h`;
      const dy = Math.floor(h / 24);
      return `hace ${dy} d`;
    } catch {
      return "";
    }
  }

  // Normaliza un Thread (Firestore) a CardData (lo que pinta ThreadCard)
  function toCardData(t: Thread): CardData {
    const any = t as any;
    const created = any.createdAt;
    const lastAct = any.lastActivityAt ?? any.updatedAt ?? created;
    return {
      id: any.id,
      title: any.title ?? "Sin título",
      excerpt: any.excerpt ?? any.summary ?? "",
      author: {
        name: any.authorName ?? any.author?.name ?? "Usuario",
        handle: any.author?.handle ?? "",
        avatar: any.author?.avatarUrl ?? null,
      },
      createdAt: ago(created),
      lastActivity: { by: any.lastActorName ?? "", when: ago(lastAct) },
      category: any.category ?? "general",
      // Después (limpia espacios, quita vacíos y deduplica):
      tags: Array.from(
        new Set(
          (any.tags ?? [])
            .map((x: any) => String(x).trim())
            .filter(Boolean)
        )
      ),
      pinned: !!any.pinned,
      solved: any.status === "resolved" || !!any.resolved,
      replies: Number(any.repliesCount ?? any.commentsCount ?? 0),
      views: Number(any.viewsCount ?? any.views ?? 0),
    };
  }

  // Aplica filtros/orden al arreglo real y mapea a CardData
  const filteredReal = useMemo(() => {
    let list = items.slice();

    if (category !== "all")
      list = list.filter((t: any) => (t.category ?? (t as any).category) === category);
    if (onlySolved) list = list.filter((t: any) => t.status === "resolved" || t.resolved === true);

    if (q.trim()) {
      const z = q.toLowerCase();
      list = list.filter((t: any) => {
        const title = String(t.title ?? "").toLowerCase();
        const excerpt = String((t.excerpt ?? t.summary ?? "")).toLowerCase();
        const tags = (t.tags ?? []).map((x: string) => x.toLowerCase());
        return title.includes(z) || excerpt.includes(z) || tags.some((x: string) => x.includes(z));
      });
    }

    switch (sort) {
      case "populares":
        list.sort((a: any, b: any) => Number(b.viewsCount ?? 0) - Number(a.viewsCount ?? 0));
        break;
      case "sinrespuesta":
        list.sort(
          (a: any, b: any) =>
            Number(a.repliesCount ?? a.commentsCount ?? 0) -
            Number(b.repliesCount ?? b.commentsCount ?? 0)
        );
        break;
      default: {
        // recientes: pinned primero, luego por lastActivityAt/updatedAt/createdAt desc
        const stamp = (x: any) =>
          (x.lastActivityAt ?? x.updatedAt ?? x.createdAt)?.toMillis?.() ?? 0;
        list.sort(
          (a: any, b: any) => Number(!!b.pinned) - Number(!!a.pinned) || stamp(b) - stamp(a)
        );
      }
    }

    return list.map(toCardData);
  }, [items, q, category, onlySolved, sort]);

  const nav = useNavigate();
  const handleCreate = () => nav("/nuevo");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onCreate={handleCreate} />
      <FiltersBar
        q={q}
        setQ={setQ}
        category={category}
        setCategory={setCategory}
        onlySolved={onlySolved}
        setOnlySolved={setOnlySolved}
        sort={sort}
        setSort={setSort}
      />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8 xl:col-span-9">
          {/* 🔥 Hilos reales desde Firestore */}
          {filteredReal.map((t) => <ThreadCard key={t.id} t={t} />)}


          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <span>
            Mostrando <b>{Math.min(filteredReal.length, 10)}</b> de <b>{filteredReal.length}</b>
          </span>

            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                Anterior
              </button>
              <button className="rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                Siguiente
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Ahora mismo en la comunidad (Firestore) */}
          <NowWidget take={3} linkAllHref="/threads" />

          {/* Tus widgets mock tal cual */}
          <Sidebar onCreate={handleCreate} />
        </aside>
      </main>
      <Footer />
    </div>
  );
}

export default ForumMock;
