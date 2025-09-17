// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url'; // <-- IMPORTA ESTO
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)), // suficiente
            // si quieres, añade más, pero no uses __dirname:
            '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
            '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
            '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        },
    },
});
