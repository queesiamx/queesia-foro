// src/pages/UserProfile.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { auth, db, storage } from "@/firebase";
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
} from "firebase/firestore";
import { Eye, MessageSquare } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  displayName?: string;
  bio?: string;
  role?: string;
  photoURL?: string;
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

  // Nombre público derivado de hilos / posts (cuando no se puede leer /users)
  const [fallbackDisplayName, setFallbackDisplayName] = useState<string | null>(
    null
  );

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingReplies, setLoadingReplies] = useState(true);

  // === Estado para edición de perfil (solo para el dueño) ===
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Avatar
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);

  // Usuario logueado
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => off();
  }, []);

  const isMe = currentUser && uid && currentUser.uid === uid;

  // Datos del usuario (bio, nombre público, rol, photoURL) desde /users/{uid}
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
      () => {
        setUserDoc(null);
      }
    );

    return () => off();
  }, [uid]);

  // Inicializar valores del formulario cuando cargan datos del dueño
  useEffect(() => {
    if (!isMe || editMode) return;

    const baseName =
      userDoc?.displayName ||
      currentUser?.displayName ||
      currentUser?.email ||
      "";

    setEditName(baseName);
    setEditBio(userDoc?.bio ?? "");
    setEditRole(userDoc?.role ?? "");
    setPendingAvatarFile(null);
    setPreviewAvatarUrl(null);
  }, [isMe, editMode, userDoc, currentUser]);

  // Limpiar URL de preview al desmontar/cambiar
  useEffect(() => {
    return () => {
      if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
    };
  }, [previewAvatarUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPendingAvatarFile(file);

    if (previewAvatarUrl) {
      URL.revokeObjectURL(previewAvatarUrl);
      setPreviewAvatarUrl(null);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewAvatarUrl(url);
    }
  };

  // Guardar cambios de perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !uid || currentUser.uid !== uid || !db) return;

    try {
      setSaving(true);
      const refUser = doc(db, "users", uid);

      let newPhotoURL = userDoc?.photoURL ?? null;

      // Si hay nuevo avatar, subir a Storage
      if (pendingAvatarFile && storage) {
        const avatarRef = ref(storage, `avatars/${uid}.jpg`);
        await uploadBytes(avatarRef, pendingAvatarFile);
        newPhotoURL = await getDownloadURL(avatarRef);
      }

      await updateDoc(refUser, {
        displayName: editName.trim() || null,
        bio: editBio.trim(),
        role: editRole.trim() || null,
        photoURL: newPhotoURL,
      });

      setEditMode(false);
      setPendingAvatarFile(null);
      if (previewAvatarUrl) {
        URL.revokeObjectURL(previewAvatarUrl);
        setPreviewAvatarUrl(null);
      }
    } catch (err) {
      console.error("Error actualizando perfil:", err);
      alert("No se pudieron guardar los cambios. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // Hilos recientes + stats (vistas e hilos)
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

  // Respuestas recientes + stats (respuestas y votos)
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

  // Reputación suave
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

  const bioText = userDoc?.bio?.trim();
  const roleText = userDoc?.role?.trim();
  const avatarSrc = previewAvatarUrl || userDoc?.photoURL || null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Encabezado */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatarSrc ? (
            <img
              src={avatarSrc}
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
              Participante en la comunidad de Queesia · Foro
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
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Preview avatar"
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
                  className="text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Imágenes JPG o PNG. Idealmente cuadradas.
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
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
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
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
                  setPendingAvatarFile(null);
                  if (previewAvatarUrl) {
                    URL.revokeObjectURL(previewAvatarUrl);
                    setPreviewAvatarUrl(null);
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
              ? "Aún no has agregado una descripción pública. Pronto podremos editarla desde tu perfil."
              : "Esta persona aún no ha agregado una descripción pública."}
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
                  <Link
                    to={`/thread/${t.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {t.title ?? "Sin título"}
                  </Link>
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
                  <Link
                    to={`/thread/${r.threadId}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {r.threadTitle ?? "Respuesta en un hilo"}
                  </Link>
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

      <div className="pt-2">
        <Link
          to="/feed"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← Volver al feed
        </Link>
      </div>
    </div>
  );
}
