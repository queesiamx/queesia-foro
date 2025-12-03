// src/components/Footer.jsx
import { Instagram, Facebook } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 bg-black text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-5">
        {/* Redes sociales centradas */}
        <div className="flex items-center justify-center gap-5">
          {/* Instagram (Lucide) */}
          <a
            href="https://www.instagram.com/quees_ia"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-pink-400"
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>

          {/* Facebook (Lucide) */}
          <a
            href="https://www.facebook.com/share/16tCkmXBzp/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-blue-500"
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>

          {/* Threads (SVG) */}
          <a
            href="https://www.threads.net/@quees_ia"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-purple-400"
            title="Threads"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M254.5 32C136.6 32 64 111.6 64 215.5c0 72.3 48.1 138.6 132.5 160.2 9.3-6.4 18.1-13.7 26.3-21.9-49.1-12.2-81.4-52.6-81.4-106.7 0-80.3 60.4-137.3 145.1-137.3 73.6 0 130.6 52.1 130.6 129.3 0 92.8-78.4 168.1-185.1 168.1-21.4 0-44.6-3.5-63.2-8.6-9.4 11.6-21.4 22.3-34.5 30.7 32.3 9.7 70.7 14.6 102.4 14.6 130.3 0 224.1-88.3 224.1-203.4C446.3 116.7 361.9 32 254.5 32z" />
            </svg>
          </a>

          {/* TikTok (SVG) */}
          <a
            href="https://www.tiktok.com/@quees_ia"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
            title="TikTok"
          >
            <svg
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M168 16c8.7 19.8 24.6 35.7 44.4 44.4A92.6 92.6 0 0 0 216 96c-18.6 0-36.1-5.6-50.7-15.2l-.3 58.5c0 31.4-25.5 56.9-56.9 56.9S51.2 170.7 51.2 139.3 76.7 82.4 108.1 82.4c6.1 0 12 1 17.5 2.9v28a28.9 28.9 0 0 0-17.5-5.8c-17.1 0-31 13.9-31 31 0 17.1 13.9 31 31 31s31-13.9 31-31l.4-142.9H168Z" />
            </svg>
          </a>

          {/* X / Twitter (SVG) */}
          <a
            href="https://x.com/quees_ia"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
            title="X (Twitter)"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="w-5 h-5"
              fill="currentColor"
            >
              <path d="M18.244 2H21l-6.54 7.47L22 22h-6.79l-4.51-5.87L5.6 22H3l7.15-8.17L2 2h6.9l4.08 5.46L18.244 2Zm-1.19 18h1.59L7.08 4H5.42l11.634 16Z" />
            </svg>
          </a>

          {/* YouTube (SVG) */}
          <a
            href="https://www.youtube.com/@Quees_IA"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-red-400"
            title="YouTube"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.7-.8-1.5-.8-1.9-.9C18.1 2.7 12 2.7 12 2.7h0s-6.1 0-8.8.3c-.4 0-1.2.1-1.9.9-.6.7-.8 2.3-.8 2.3S0 8.1 0 10v1.9c0 1.9.2 3.8.2 3.8s.2 1.6.8 2.3c.7.8 1.7.8 2.2.9 1.6.1 8.8.3 8.8.3s6.1 0 8.8-.3c.4 0 1.5 0 2.2-.9.6-.7.8-2.3.8-2.3s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8zM9.6 14.7V7.8l6.1 3.5-6.1 3.4z" />
            </svg>
          </a>
        </div>

        {/* Texto + enlaces legales centrados */}
        <div className="flex flex-col items-center gap-1 text-xs sm:text-sm">
          <p className="text-center">
            © {year} Queesia. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/terminos" className="hover:underline">
              Términos y Condiciones
            </a>
            <a href="/privacidad" className="hover:underline">
              Aviso de Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
