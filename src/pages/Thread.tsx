// Ejemplo mínimo del feed central
export default function Threads() {
  const items = [
    { id: "1", title: "Guía visual de estilos para el foro (v1)", tags: ["ui", "tailwind"], replies: 8, views: 980 },
    { id: "2", title: "¿Cómo integro Firebase Auth con Vite + React sin romper el routing?", tags: ["firebase","vite","auth"], replies: 12, views: 425 },
    { id: "3", title: "[Ayuda] Sombra amarilla debajo de la navbar: ¿de dónde sale?", tags: ["debug","css"], replies: 4, views: 310 },
  ];

  return (
    <div className="space-y-4">
      {items.map((t) => (
        <a
          key={t.id}
          href={`/threads/${t.id}`}
          className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-indigo-600 text-white grid place-items-center font-semibold">
              {t.title[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{t.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {t.tags.map((tg) => (
                  <span key={tg} className="rounded-full bg-slate-100 px-2 py-0.5">#{tg}</span>
                ))}
                <span className="ml-auto">💬 {t.replies}</span>
                <span>👁 {t.views}</span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
