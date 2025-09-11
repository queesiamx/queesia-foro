import { Link } from "react-router-dom";
import { ShieldCheck, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function Rules() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm uppercase tracking-wider text-slate-500">Queesia · Comunidad</div>
              <h1 className="text-2xl font-bold text-slate-900">Reglas del Foro</h1>
              <p className="text-sm text-slate-500">Última actualización: 2025-09-10</p>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Aviso corto */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-slate-700">
                Al participar en el foro aceptas estas reglas. El equipo de moderación puede mover/editar títulos,
                etiquetas y categorías para mejorar la claridad.
              </p>
            </div>
          </div>
        </div>

        {/* Índice */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contenido</h2>
          <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <li><a className="hover:underline" href="#convivencia">1) Convivencia</a></li>
            <li><a className="hover:underline" href="#temas">2) Alcance y temas</a></li>
            <li><a className="hover:underline" href="#publicaciones">3) Publicaciones de calidad</a></li>
            <li><a className="hover:underline" href="#resuelto">4) Resuelto / Reconocimiento</a></li>
            <li><a className="hover:underline" href="#promo">5) Spam y autopromoción</a></li>
            <li><a className="hover:underline" href="#propiedad">6) Propiedad intelectual</a></li>
            <li><a className="hover:underline" href="#privacidad">7) Privacidad y seguridad</a></li>
            <li><a className="hover:underline" href="#sensible">8) Contenido sensible</a></li>
            <li><a className="hover:underline" href="#ia">9) Contenido generado por IA</a></li>
            <li><a className="hover:underline" href="#cuentas">10) Nombres y cuentas</a></li>
            <li><a className="hover:underline" href="#moderacion">11) Moderación y reportes</a></li>
            <li><a className="hover:underline" href="#idioma">12) Idioma y formato</a></li>
          </ul>
        </div>

        {/* Reglas */}
        <section id="convivencia" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">1) Convivencia</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Trato cordial y profesional. Prohibido acoso, odio, discriminación o doxxing.</li>
            <li>Debate ideas, no personas. Evita sarcasmo/hostilidad. Lenguaje inclusivo.</li>
          </ul>
        </section>

        <section id="temas" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">2) Alcance y temas</h3>
          <p className="mt-2 text-sm text-slate-700">
            Tópicos principales: IA, desarrollo, diseño, producto y buenas prácticas. Off-topic solo en áreas designadas.
          </p>
        </section>

        <section id="publicaciones" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">3) Publicaciones de calidad</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li><b>Título claro</b> (evita “URGENTE!!!”).</li>
            <li><b>Contexto reproducible</b>: versión, entorno, pasos, qué esperabas y qué obtuviste.</li>
            <li>Código formateado (bloques <code>```</code>), capturas y logs sin secretos.</li>
            <li>Una duda por hilo. Busca antes de publicar. Categoría y <b>etiquetas</b> (máx. 6) acordes.</li>
          </ul>
        </section>

        <section id="resuelto" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">4) Resuelto / Reconocimiento</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Marca como <b>Resuelto</b> la respuesta que te sirvió.</li>
            <li>Si mejoraste la solución, edita el primer post con el resultado.</li>
          </ul>
        </section>

        <section id="promo" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">5) Spam, ventas y autopromoción</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Prohibido spam.</li>
            <li>Autopromoción (cursos, videos, herramientas) solo en la sección permitida y con <b>disclaimer</b>; máx. 1 cada 7 días; aporta valor real.</li>
            <li>Enlaces de afiliados deben declararse explícitamente.</li>
          </ul>
        </section>

        <section id="propiedad" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">6) Propiedad intelectual</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>No publiques material con copyright sin permiso ni software pirateado.</li>
            <li>Cita siempre las fuentes. Considera licenciar tu contenido (p. ej., CC-BY-SA).</li>
          </ul>
        </section>

        <section id="privacidad" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">7) Privacidad y seguridad</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>No compartas datos personales tuyos o de terceros.</li>
            <li><b>Nunca</b> publiques tokens, claves, secretos o credenciales.</li>
            <li>Prohibido malware, phishing o explotación de vulnerabilidades.</li>
            <li>Divulgación responsable: reporta fallos por privado al equipo.</li>
          </ul>
        </section>

        <section id="sensible" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">8) Contenido sensible</h3>
          <p className="mt-2 text-sm text-slate-700">
            Prohibido contenido sexual explícito, violento, de odio o que promueva autolesiones. Este foro no sustituye
            asesoría médica o legal profesional.
          </p>
        </section>

        <section id="ia" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">9) Contenido generado por IA</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Indica la herramienta usada (p. ej., “generado con X”).</li>
            <li>Verifica exactitud y derechos antes de publicar.</li>
          </ul>
        </section>

        <section id="cuentas" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">10) Nombres y cuentas</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Sin nombres/avatares ofensivos o engañosos. Prohibida la suplantación. Una cuenta por persona.</li>
          </ul>
        </section>

        <section id="moderacion" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">11) Moderación y reportes</h3>
          <p className="mt-2 text-sm text-slate-700">
            Usa “Denunciar” para avisar al equipo. Los moderadores pueden mover/editar publicaciones por claridad.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <RuleStep
              icon={<AlertTriangle className="h-4 w-4" />}
              title="1. Aviso"
              desc="Recordatorio de regla y/o edición ligera."
            />
            <RuleStep
              icon={<ShieldCheck className="h-4 w-4" />}
              title="2. Suspensión"
              desc="24 h a 7 d por reincidencia o gravedad."
            />
            <RuleStep
              icon={<CheckCircle2 className="h-4 w-4" />}
              title="3. Ban"
              desc="Permanente en casos graves. Apelación por soporte."
            />
          </div>
        </section>

        <section id="idioma" className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">12) Idioma y formato</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Español claro (neutral). Evita TODO MAYÚSCULAS.</li>
            <li>Títulos sin etiquetas dentro (usa el campo de tags).</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function RuleStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-slate-700">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          <div className="text-xs text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}
