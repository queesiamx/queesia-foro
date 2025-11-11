// src/utils/safeRender.ts
import { marked } from "marked";
import DOMPurify from "dompurify";

/** Convierte Markdown a HTML y lo sanea (XSS-safe) */
export function renderSafe(md?: string) {
  const html = marked.parse(md ?? "");
  // `marked.parse` puede devolver string | Promise<string> según la config; lanzamos a string.
  return {
    __html: DOMPurify.sanitize(String(html), { USE_PROFILES: { html: true } }) as string,
  };
}
