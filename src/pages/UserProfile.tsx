// src/pages/UserProfile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { Eye, MessageSquare, Trash2 } from "lucide-react";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import ForumNavbar from "@/components/ForumNavbar";

type ThreadLite = {
  id: string;
  title?: string;
  tags?: string[];
  viewsCount?: number;
  repliesCount?: number;
  createdAt?: Timestamp;
  lastActivityAt?: Timestamp;
};

type PostLite = {
  id: string;
  threadId: string;
  threadTitle?: string;
  createdAt?: Timestamp;
  upvotes?: number;
};

type UserDoc = {
  displayName?: string | null;
  bio?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

type Stats = {
  threadsCount: number;
  repliesCount: number;
  totalViews: number;
  totalUpvotes: number;
  acceptedAnswers: number;
};

const emptyStats: Stats = {
  threadsCount: 0,
  repliesCount: 0,
  totalViews: 0,
  totalUpvotes: 0,
  acceptedAnswers: 0,
};

const toDate = (d?: Timestamp) =>
  d instanceof Timestamp ? d.toDate() : undefined;

const fmtShort = (d?: Date) =>
  d
    ? new Intl.DateTimeFormat("es", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d)
    : "";

export default function UserProfile() {
  const { uid } = useParams<{ uid: string }>();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);

  const [threads, setThreads] = useState<ThreadLite[]>([]);
  const [replies, setReplies] = useState<PostLite[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);

  const [fallbackDisplayName, setFallbackDisplayName] = useState<string | null>(
    null
  );

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);

  // Estado de edición de perfil (solo para el dueño)
  const [editMode, setEditMode] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Avatar local (preview) + archivo seleccionado
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => off();
  }, []);

  const isMe = currentUser && uid && currentUser.uid === uid;

  // Carga del documento /users/{uid}
  useEffect(() => {
    if (!uid || !db) return;

    const refUser = doc(db, "users", uid);
    const off = onSnapshot(
      refUser,
      (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data() as UserDoc);
        } else {
          setUserDoc(null);
        }
      },
      () => setUserDoc(null)
    );

    return () => off();
  }, [uid]);

  // Inicializar formulario de edición cuando cambiamos a modo edición
  useEffect(() => {
    if (!isMe || !currentUser) return;

    const baseName =
      userDoc?.displayName ||
      currentUser.displayName ||
      currentUser.email ||
      "";

    setDraftName(baseName);
    setDraftBio(userDoc?.bio ?? "");
    setDraftRole(userDoc?.role ?? "");
  }, [isMe, currentUser, userDoc, editMode]);

  // Limpiar URL de preview al desmontar
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(null);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreviewUrl(url);
    }
  };

  // Hilos recientes + stats
  useEffect(() => {
    if (!uid || !db) return;
    setLoadingThreads(true);

    const qThreads = query(
      collection(db, "threads"),
      where("authorId", "==", uid),
      orderBy("lastActivityAt", "desc"),
      limit(5)
    );

    const off = onSnapshot(
      qThreads,
      (snap) => {
        const items: ThreadLite[] = [];
        let totalViews = 0;
        let nameFromThreads: string | null = null;

        snap.forEach((d) => {
          const data = d.data() as any;

          if (!nameFromThreads) {
            nameFromThreads =
              data.authorName ??
              data.authorDisplayName ??
              data.author?.displayName ??
              null;
          }

          items.push({
            id: d.id,
            title: data.title,
            tags: data.tags ?? [],
            viewsCount: data.viewsCount ?? data.views ?? 0,
            repliesCount: data.repliesCount ?? 0,
            createdAt: data.createdAt,
            lastActivityAt: data.lastActivityAt,
          });

          const v =
            typeof data.viewsCount === "number"
              ? data.viewsCount
              : data.views ?? 0;
          totalViews += v;
        });

        if (nameFromThreads) {
          setFallbackDisplayName((prev) => prev ?? nameFromThreads!);
        }

        setThreads(items);
        setStats((prev) => ({
          ...prev,
          threadsCount: snap.size,
          totalViews,
        }));
        setLoadingThreads(false);
      },
      (err) => {
        console.error("Error cargando hilos del perfil:", err);
        setThreads([]);
        setStats((prev) => ({ ...prev, threadsCount: 0, totalViews: 0 }));
        setLoadingThreads(false);
      }
    );

    return () => off();
  }, [uid]);

  // Respuestas recientes + stats
  useEffect(() => {
    if (!uid || !db) return;
    setLoadingReplies(true);

    const qPosts = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const off = onSnapshot(
      qPosts,
      (snap) => {
        const items: PostLite[] = [];
        let totalUpvotes = 0;

        snap.forEach((d) => {
          const data = d.data() as any;
          items.push({
            id: d.id,
            threadId: data.threadId,
            threadTitle: data.threadTitle,
            createdAt: data.createdAt,
            upvotes: data.upvotes ?? 0,
          });
          const u = typeof data.upvotes === "number" ? data.upvotes : 0;
          totalUpvotes += u;
        });

        setReplies(items);
        setStats((prev) => ({
          ...prev,
          repliesCount: snap.size,
          totalUpvotes,
          acceptedAnswers: prev.acceptedAnswers,
        }));
        setLoadingReplies(false);
      },
      (err) => {
        console.error("Error cargando respuestas del perfil:", err);
        setReplies([]);
        setStats((prev) => ({
          ...prev,
          repliesCount: 0,
          totalUpvotes: 0,
        }));
        setLoadingReplies(false);
      }
    );

    return () => off();
  }, [uid]);

  // Reputación (heurística simple)
  const reputation = useMemo(() => {
    const base =
      stats.threadsCount * 5 +
      stats.repliesCount * 10 +
      stats.totalUpvotes * 1 +
      stats.acceptedAnswers * 15;
    return base;
  }, [stats]);

  const displayName = useMemo(
    () =>
      userDoc?.displayName ??
      (isMe
        ? currentUser?.displayName ?? currentUser?.email ?? "Tú"
        : fallbackDisplayName ?? "Usuario"),
    [userDoc, isMe, currentUser, fallbackDisplayName]
  );

  const bioText = userDoc?.bio?.trim() || "";
  const roleText = userDoc?.role?.trim() || "";
  const avatarUrl = userDoc?.avatarUrl || null;
  const effectiveAvatarSrc = avatarPreviewUrl || avatarUrl || null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !uid || currentUser.uid !== uid || !db) return;

    try {
      setSaving(true);
      setSuccessMessage(null); // 👈 limpiamos cualquier mensaje previo
      const refUser = doc(db, "users", uid);

      let newAvatarUrl = avatarUrl;

      // Subir avatar a Cloudinary solo si se seleccionó un archivo nuevo
      if (avatarFile) {
        try {
          newAvatarUrl = await uploadImageToCloudinary(avatarFile);
        } catch (err) {
          console.error("Error subiendo avatar a Cloudinary:", err);
          alert(
            "No se pudo subir la imagen de avatar. Se guardarán tus datos de texto sin cambiar el avatar."
          );
        }
      }

      await updateDoc(refUser, {
        displayName: draftName.trim() || null,
        bio: draftBio.trim(),
        role: draftRole.trim() || null,
        avatarUrl: newAvatarUrl ?? null,
        updatedAt: serverTimestamp(),
      });

      setEditMode(false);
      setAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }

   // 👇 feedback visual de éxito
    setSuccessMessage("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      alert("No se pudieron guardar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteReply = async (postId: string) => {
  if (!isMe || !uid) return;
  const ok = confirm("¿Eliminar esta respuesta? Esta acción no se puede deshacer.");
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "posts", postId));
  } catch (err) {
    console.error("Error eliminando post:", err);
    alert("No se pudo eliminar la respuesta. Intenta de nuevo.");
  }
};

const handleDeleteThread = async (threadId: string, threadTitle?: string) => {
  if (!isMe || !uid) return;

  const ok = confirm(
    `¿Eliminar el hilo${threadTitle ? ` “${threadTitle}”` : ""}?\n\n` +
      `El hilo dejará de estar disponible, pero las respuestas (incluyendo las de otros) no se borrarán y podrán aparecer como actividad en perfiles.`
  );
  if (!ok) return;

  try {
    await deleteDoc(doc(db, "threads", threadId));
  } catch (err) {
    console.error("Error eliminando thread:", err);
    alert("No se pudo eliminar el hilo. Intenta de nuevo.");
  }
};



  return (

          
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <ForumNavbar />


      <div className="pt-2">
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← Volver
        </Link>
      </div>
      {/* Encabezado */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {effectiveAvatarSrc ? (
            <img
              src={effectiveAvatarSrc}
              alt={displayName || "Avatar"}
              className="h-12 w-12 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-xl font-bold">
              {displayName?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-semibold text-slate-900">
              {displayName}
            </h1>
            <p className="text-xs text-slate-500">
              Participante en la comunidad de Quesia · Foro
              {roleText ? ` · ${roleText}` : ""}
            </p>
          </div>
        </div>

        <div className="text-right text-xs text-slate-600">
          <p>
            <span className="font-semibold">{stats.threadsCount}</span> Hilos
            creados
          </p>
          <p>
            <span className="font-semibold">{stats.repliesCount}</span>{" "}
            Respuestas
          </p>
          <p>
            <span className="font-semibold">{reputation}</span> Reputación
          </p>
        </div>
      </section>

      {/* Acerca de mí + edición */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Acerca de mí</h2>
          {isMe && (
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className="text-xs px-3 py-1 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              {editMode ? "Cancelar" : "Editar perfil"}
            </button>
          )}
        </div>

        {editMode && isMe ? (
          <form className="space-y-4 mt-1" onSubmit={handleSaveProfile}>
            {/* Avatar */}
            <div className="flex items-center gap-3">
              {effectiveAvatarSrc ? (
                <img
                  src={effectiveAvatarSrc}
                  alt="Avatar actual"
                  className="h-12 w-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-amber-400 text-white grid place-items-center text-xl font-bold">
                  {displayName?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Avatar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="
                    block w-full text-xs text-slate-700
                    file:mr-3 file:rounded-full file:border-0
                    file:bg-indigo-50 file:px-3 file:py-1.5
                    file:text-xs file:font-medium file:text-indigo-700
                    hover:file:bg-indigo-100
                  "
                />

                <p className="text-[11px] text-slate-400">
                  La imagen se almacena en Cloudinary. Usa una imagen cuadrada
                  y ligera.
                </p>
              </div>
            </div>

            {/* Nombre público */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Nombre público
              </label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                maxLength={60}
                placeholder="Cómo quieres aparecer en el foro"
              />
            </div>

            {/* Rol / especialidad */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Rol / especialidad
              </label>
              <input
                type="text"
                value={draftRole}
                onChange={(e) => setDraftRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500"
                maxLength={80}
                placeholder="Ej. Ing. en TI · Interés en IA aplicada"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Descripción pública (bio)
              </label>
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 resize-none"
                maxLength={600}
                placeholder="Cuenta brevemente quién eres, qué te interesa o en qué temas sueles participar."
              />
              <p className="text-[11px] text-slate-400">
                Esto es visible para toda la comunidad. Evita compartir datos
                personales sensibles.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setEditMode(false);
                  setAvatarFile(null);
                  if (avatarPreviewUrl) {
                    URL.revokeObjectURL(avatarPreviewUrl);
                    setAvatarPreviewUrl(null);
                  }
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : bioText ? (
          <div className="space-y-1">
            {roleText && (
              <p className="text-xs text-slate-500 mb-1">
                Rol / especialidad:{" "}
                <span className="font-medium">{roleText}</span>
              </p>
            )}
            <p className="text-sm text-slate-700 whitespace-pre-line">
              {bioText}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has agregado una descripción pública. Usa el botón “Editar perfil” para agregarla."
              : "Esta persona aún no ha agregado una descripción pública."}
          </p>
        )}

        {successMessage && (
          <p className="mt-3 text-xs font-medium text-emerald-700">
            {successMessage}
          </p>
        )}
      </section>

      {/* Stats del usuario */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Stats del usuario
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.totalViews}
            </div>
            <div className="text-slate-500">Vistas generadas en sus hilos</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.totalUpvotes}
            </div>
            <div className="text-slate-500">
              Votos recibidos en sus respuestas
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {stats.acceptedAnswers}
            </div>
            <div className="text-slate-500">
              Respuestas marcadas como “mejor respuesta”
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {reputation}
            </div>
            <div className="text-slate-500">Reputación acumulada</div>
          </div>
        </div>
      </section>

      {/* Hilos recientes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Hilos recientes
          </h2>
        </div>

        {loadingThreads ? (
          <p className="text-sm text-slate-500">Cargando actividad…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has creado hilos en el foro."
              : "Esta persona aún no ha creado hilos en el foro."}
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {threads.map((t) => {
              const created = toDate(t.createdAt) ?? toDate(t.lastActivityAt);
              return (
                <li
                  key={t.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 flex flex-col gap-1"
                >
                 <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/thread/${t.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {t.title ?? "Sin título"}
                </Link>

                {isMe && (
                  <button
                    type="button"
                    onClick={() => handleDeleteThread(t.id, t.title)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                    title="Eliminar hilo"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                )}
              </div>


                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {created && <span>{fmtShort(created)}</span>}
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />{" "}
                      {t.repliesCount ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {t.viewsCount ?? 0}
                    </span>
                    {(t.tags ?? [])
                      .slice(0, 3)
                      .map((tag, idx) => (
                        <span
                          key={`${t.id}-${idx}`}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Respuestas recientes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Respuestas recientes
          </h2>
        </div>

        {loadingReplies ? (
          <p className="text-sm text-slate-500">Cargando actividad…</p>
        ) : replies.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isMe
              ? "Aún no has respondido en otros hilos."
              : "Esta persona aún no ha respondido en otros hilos."}
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {replies.map((r) => {
              const created = toDate(r.createdAt);
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/thread/${r.threadId}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {r.threadTitle ?? "Hilo no disponible (el autor lo eliminó)"}
                </Link>

                {isMe && (
                  <button
                    type="button"
                    onClick={() => handleDeleteReply(r.id)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-rose-200 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-50"
                    title="Eliminar respuesta"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                )}
              </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {created && <span>{fmtShort(created)}</span>}
                    <span>{r.upvotes ?? 0} votos</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>  
    </div>
  );
}
