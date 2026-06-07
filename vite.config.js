import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxImportSource: undefined,
  },
  server: {
    port: 5173,
  },
});
