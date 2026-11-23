import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: '127.0.0.1', port: 0, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true }
});
