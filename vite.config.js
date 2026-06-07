import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    jsx: 'transform',
    jsxImportSource: undefined,
  },
  server: {
    port: 5173,
  },
});
