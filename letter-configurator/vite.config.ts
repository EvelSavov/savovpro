import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/letter-configurator/dist/',
  server: {
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['manifold-3d'],
  },
  worker: {
    format: 'es',
  },
});
