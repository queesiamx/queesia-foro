/** @type {import('tailwindcss').Config} */
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    "bg-primary-soft",
    "bg-default-soft",
    "text-primary",
    "text-default",
    "hover:text-primary-soft",
    "animate-pulse",
    "font-montserrat",
    "font-display",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Raleway", ...defaultTheme.fontFamily.sans],
        montserrat: ["Montserrat", "sans-serif"],
        display: ["Montserrat", ...defaultTheme.fontFamily.sans],
      },
      // ✅ Recomendado: mapear a CSS variables para que Apps/Foro compartan “tokens”
colors: {
  primary: "rgb(var(--color-primary) / <alpha-value>)",
  "primary-soft": "rgb(var(--color-primary-soft) / <alpha-value>)",
  default: "rgb(var(--color-default) / <alpha-value>)",
  "default-soft": "rgb(var(--color-default-soft) / <alpha-value>)",
  "default-strong": "rgb(var(--color-default-strong) / <alpha-value>)",
  glass: "rgb(var(--color-glass) / <alpha-value>)",
  line: "rgb(var(--color-line) / <alpha-value>)",
},

    },
  },
  plugins: [require("@tailwindcss/typography")],
};