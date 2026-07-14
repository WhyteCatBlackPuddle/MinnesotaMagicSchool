import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/living-map/',
  plugins: [react()],
  build: {
    outDir: '../public/living-map',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3456',
    },
  },
});
