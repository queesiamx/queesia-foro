import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSidebarCounts, watchTrendingThreads } from "@/services/forum";
import type { Thread } from "@/types/forum";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { watchIsFollowing } from "@/services/follow";
import LogoQueso from "../assets/logo-bg.png";
import BgAmorph from "@/assets/bg_amorph.svg";


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
  ShieldAlert, // 👈 NUEVO
  Menu,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import NowWidget from "@/components/NowWidget";
// RTC-CO (Home.tsx – imports)
import UserMenu from "@/components/UserMenu";
import Footer from "@/components/Footer";
import NotificationBell from "@/components/NotificationBell"; // 👈 NUEVO

const ADMIN_EMAILS = ["queesiamx@gmail.com", "queesiamx.employee@gmail.com"];

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
    // 👇 NUEVO
  authorId?: string;

  createdAt: string;
  lastActivity: { by: string; when: string };
  category: string;
  tags: string[];
  pinned: boolean;

  // 👇 NUEVOS estados derivados
  isNew: boolean;
  isTrending: boolean;
  isSolved: boolean;

  // 👇 lo de siempre (mantenemos solved por compatibilidad)
  solved: boolean;
  replies: number;
  views: number;
};


// --- UI pieces ---
function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      const email = user?.email ?? "";
      setIsAdmin(ADMIN_EMAILS.includes(email));
    });
    return () => off();
  }, []);

  // Cierra menú al navegar (sobre todo útil en móvil)
  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className="fixed top-0 left-0 z-50 w-full h-16
                 bg-white/40 backdrop-blur-xl border border-white/40
                 shadow-md shadow-slate-900/10"
    >
      <div
        className="
          fixed top-0 left-0 z-50 w-full
          h-14 flex items-center justify-between
          px-4
          bg-white/40 backdrop-blur-xl
          border-b border-white/40
          shadow-sm shadow-slate-900/5
        "
      >
        {/* IZQUIERDA: Marca */}
        <a
          href="https://queesia.com"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-3"
          aria-label="Ir a Queesia"
          onClick={closeMobile}
        >
          <img src="/logo-bg.png" alt="Queesia" className="h-9 w-9" />
          <div className="leading-none">
            <div className="text-3xl font-bold italic">
              <span className="text-black">quees</span>
              <span className="text-blue-500">ia</span>
            </div>
          </div>
        </a>

        {/* DERECHA: Desktop nav + acciones */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-lg text-black">
            <a
              href="https://queesia.com/#catalogo"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Catálogo
            </a>
            <a
              href="https://queesia.com/casos"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Quesos de éxito
            </a>
            <a
              href="https://expertos.queesia.com"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Expertos
            </a>

            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Foro
            </Link>

            <a
              href="https://queesia.com/blog/"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://queesia.com/nosotros"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Sobre Nosotros
            </a>
            <a
              href="https://queesia.com/contacto"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              Contáctanos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/reports"
                className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-lg
                           border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800
                           hover:bg-amber-100"
              >
                <ShieldAlert className="h-4 w-4" />
                Panel moderación
              </Link>
            )}

            <NotificationBell />
            <UserMenu />
          </div>
        </div>

        {/* MÓVIL: acciones + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationBell />
          <UserMenu />

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl
                       border border-white/40 bg-white/30 backdrop-blur
                       hover:bg-white/40"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* PANEL MÓVIL */}
      {mobileOpen && (
        <div className="fixed top-14 left-0 z-50 w-full lg:hidden">
          <div className="mx-3 mt-2 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-900/10 overflow-hidden">
            <div className="flex flex-col p-3 text-base text-slate-900">
              <a
                href="https://queesia.com/#catalogo"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Catálogo
              </a>
              <a
                href="https://queesia.com/casos"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Quesos de éxito
              </a>
              <a
                href="https://expertos.queesia.com"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Expertos
              </a>
              <Link
                to="/"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Foro
              </Link>
              <a
                href="https://queesia.com/blog/"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Blog
              </a>
              <a
                href="https://queesia.com/nosotros"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Sobre Nosotros
              </a>
              <a
                href="https://queesia.com/contacto"
                rel="noopener noreferrer"
                onClick={closeMobile}
                className="rounded-xl px-3 py-2 hover:bg-white/60"
              >
                Contáctanos
              </a>

              {isAdmin && (
                <>
                  <div className="my-2 h-px bg-slate-200/70" />
                  <Link
                    to="/admin/reports"
                    onClick={closeMobile}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2
                               bg-amber-50/80 border border-amber-200 text-amber-900 font-semibold"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Panel moderación
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* overlay para cerrar al tocar fuera */}
          <button
            onClick={closeMobile}
            className="fixed inset-0 -z-10 cursor-default"
            aria-label="Cerrar menú (overlay)"
          />
        </div>
      )}
    </header>
  );
}





function FiltersBar({

  onCreate,
  q,
  setQ,
  category,
  setCategory,
  onlySolved,
  setOnlySolved,
  sort,
  setSort,
}: {
  
  onCreate: () => void;
  q: string;
  setQ: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  onlySolved: boolean;
  setOnlySolved: (v: boolean) => void;
  sort: "recientes" | "populares" | "sinrespuesta";
  setSort: (v: "recientes" | "populares" | "sinrespuesta") => void;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
  <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div className="mx-auto max-w-7xl px-4 py-3">
      {/* ===================== DESKTOP (md+) ===================== */}
      <div className="hidden md:flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="flex items-center gap-2">
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

          <div className="ml-2 flex items-center gap-2">
            <Link
              to="/reglas"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white/60
                         px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Reglas
            </Link>

            <button
              onClick={onCreate}
              className="
                inline-flex items-center gap-2
                h-10 px-5 rounded-full
                text-white font-semibold
                bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500
                shadow-md shadow-slate-900/10
                hover:brightness-95
              "
            >
              <Plus className="h-4 w-4" /> Crear tema
            </button>
          </div>
        </div>
      </div>

      {/* ===================== MÓVIL (<md) ===================== */}
      <div className="md:hidden flex flex-col gap-2">
        {/* fila 1: buscar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar temas, etiquetas o autores..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>

        {/* fila 2: acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/60
                       px-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            <Filter className="h-4 w-4 text-slate-500" />
            Filtros
          </button>

          <Link
            to="/reglas"
            className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white/60
                       px-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Reglas
          </Link>

          <button
            onClick={onCreate}
            className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4
                       text-white font-semibold
                       bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500
                       shadow-md shadow-slate-900/10 hover:brightness-95"
          >
            <Plus className="h-4 w-4" /> Crear
          </button>
        </div>
      </div>
    </div>

    {/* ===================== PANEL MÓVIL: FILTROS ===================== */}
    {mobileFiltersOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* overlay */}
        <button
          onClick={() => setMobileFiltersOpen(false)}
          className="absolute inset-0 bg-black/20"
          aria-label="Cerrar filtros"
        />

        {/* sheet */}
        <div className="absolute left-0 right-0 top-20 mx-3 rounded-2xl border border-white/40 bg-white/90 backdrop-blur-xl shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-between p-3">
            <div className="text-sm font-semibold text-slate-900">Filtros</div>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl
                         border border-slate-200 bg-white/60 hover:bg-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 pb-3 space-y-3">
            {/* Categoría */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Categoría</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Solo resueltos */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-sm text-slate-700">Solo resueltos</div>
              <Toggle checked={onlySolved} onChange={() => setOnlySolved(!onlySolved)} />
            </div>

            {/* Ordenar */}
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Ordenar</div>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 focus:border-indigo-400"
                >
                  <option value="recientes">Recientes</option>
                  <option value="populares">Populares</option>
                  <option value="sinrespuesta">Sin respuesta</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}



// Reemplaza TODO el componente por esta versión
function ThreadCard({ t }: { t: CardData }) {
  const threadHref = `/thread/${encodeURIComponent(String(t.id))}`;

  // Seguimiento: quién está logueado y si sigue este hilo
  const [userId, setUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Escucha cambios de sesión
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => off();
  }, []);

  // Escucha si el usuario sigue este hilo
  useEffect(() => {
    if (!userId) {
      setIsFollowing(false);
      return;
    }

    const off = watchIsFollowing(userId, String(t.id), (v) => {
      setIsFollowing(!!v);
    });

    return () => off();
  }, [userId, t.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white font-semibold">
          {t.author.name[0]?.toUpperCase() ?? "U"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
  {t.pinned && (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
      <Pin className="h-3 w-3" /> Fijado
    </span>
  )}

  {t.isNew && (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
      Nuevo
    </span>
  )}

  {t.isTrending && (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
      Tendencia
    </span>
  )}

  {t.isSolved && (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> Respondido
    </span>
  )}

  <CatChip id={t.category} />
</div>


          {/* ⬇️ Enlace al detalle del hilo */}
          <Link
            to={threadHref}
            className="mt-2 block truncate text-lg font-semibold text-slate-900 hover:underline"
          >
            {t.title}
          </Link>

          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.excerpt}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
           <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t.authorId ? (
                <Link
                  to={`/u/${t.authorId}`}
                  className="hover:underline text-slate-700"
                >
                  {t.author.name}
                </Link>
              ) : (
                <span className="text-slate-700">{t.author.name}</span>
              )}
              <span className="text-slate-400">·</span> {t.createdAt}
            </span>

            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Última act.: {t.lastActivity.by} ·{" "}
              {t.lastActivity.when}
            </span>
            <div className="hidden h-3 w-px bg-slate-200 sm:block" />
            <div className="flex flex-wrap items-center gap-1">
              {(t.tags ?? []).map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5"
                >
                  #{tag}
                </span>
              ))}

              {isFollowing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  ✓ Siguiendo
                </span>
              )}
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

  // 🔹 Normalizamos fechas a Date para poder calcular horas
  const createdDate =
    created?.toDate?.() ??
    (created instanceof Date ? created : created ? new Date(created) : new Date());

  const lastDate =
    lastAct?.toDate?.() ??
    (lastAct instanceof Date ? lastAct : lastAct ? new Date(lastAct) : new Date());

  const now = new Date();
  const hoursSinceCreated =
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  const hoursSinceLast =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

  // 🔹 Métricas
  const replies = Number(any.repliesCount ?? any.commentsCount ?? 0);
  const views = Number(any.viewsCount ?? any.views ?? 0);


  // normalizamos el status a string genérico
  const status = String(any.status ?? "").toLowerCase();

  const isSolved =
    Boolean(any.bestPostId) ||
    status === "resolved" ||   // ahora compara contra un string normal
    !!any.resolved;


  const isNew = hoursSinceCreated <= 24; // < 24h desde que se creó

  const isTrending =
    (replies >= 3 && hoursSinceLast <= 24) ||
    (views >= 30 && hoursSinceLast <= 24);

  return {
    id: any.id,
    title: any.title ?? "Sin título",
    excerpt: any.excerpt ?? any.summary ?? "",
    author: {
      name: any.authorName ?? any.author?.name ?? "Usuario",
      handle: any.author?.handle ?? "",
      avatar: any.author?.avatarUrl ?? null,
    },

        // 👇 NUEVO: lo tomamos directo del thread
    authorId: any.authorId ?? any.author?.id ?? undefined,

    createdAt: ago(created),
    lastActivity: { by: any.lastActorName ?? "", when: ago(lastAct) },
    category: any.category ?? "general",
    tags: Array.from(
      new Set(
        (any.tags ?? [])
          .map((x: any) => String(x).trim())
          .filter(Boolean)
      )
    ),
    pinned: !!any.pinned,

    // 👇 nuevos flags
    isNew,
    isTrending,
    isSolved,

    // 👇 mantenemos `solved` apuntando a lo mismo
    solved: isSolved,
    replies,
    views,
  };
}


  // Aplica filtros/orden al arreglo real y mapea a CardData
  const filteredReal = useMemo(() => {
    let list = items.slice();

    if (category !== "all")
      list = list.filter((t: any) => (t.category ?? (t as any).category) === category);
    if (onlySolved) list = list.filter((t: any) => t.status === "resolved" || t.resolved === true);

if (q.trim()) {
  const raw = q.trim().toLowerCase();

  // Si el usuario escribe "#ia", buscamos solo por tags = "ia"
  const term = raw.startsWith("#") ? raw.slice(1) : raw;

  list = list.filter((t: any) => {
    const title = String(t.title ?? "").toLowerCase();
    const excerpt = String((t.excerpt ?? t.summary ?? "")).toLowerCase();
    const tags = (t.tags ?? []).map((x: string) => x.toLowerCase());
    const author = String(t.authorName ?? t.author?.name ?? "").toLowerCase();

    return (
      title.includes(term) ||
      excerpt.includes(term) ||
      tags.some((x: string) => x.includes(term)) ||
      author.includes(term)
    );
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
    <div className="min-h-screen bg-transparent pt-16">

      {/* Fondo fijo tipo catálogo (amorph) */}
<div
  className="
    pointer-events-none fixed inset-0 -z-10
    [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0),#000_12%,#000_88%,rgba(0,0,0,0))]
    [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,0),#000_12%,#000_88%,rgba(0,0,0,0))]
    [mask-repeat:no-repeat]
  "
>
  <div
    className="
      w-full h-full
      [mask-image:linear-gradient(to_right,rgba(0,0,0,0),#000_10%,#000_90%,rgba(0,0,0,0))]
      [-webkit-mask-image:linear-gradient(to_right,rgba(0,0,0,0),#000_10%,#000_90%,rgba(0,0,0,0))]
      [mask-repeat:no-repeat]
    "
  >
    {/* si ya lo moviste a /public, usa /bg_amorph.svg */}
    <img src={BgAmorph} className="w-full h-full object-cover opacity-25" alt="" />
  </div>
</div>

      <Navbar />
      <FiltersBar
      onCreate={handleCreate}
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
          <NowWidget take={3} linkAllHref="/feed" />

          {/* Tus widgets mock tal cual */}
          <Sidebar onCreate={handleCreate} />
        </aside>
      </main>
      <Footer />
    </div>
  );
}

export default ForumMock;
