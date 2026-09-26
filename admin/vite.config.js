import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin panel /admin/ manzilida ishlaydi (backend build'ni shu yo'lda ko'rsatadi).
// Vercel'da alohida domen bo'lsa — ADMIN_BASE=/ env qo'ying
export default defineConfig({
  base: process.env.ADMIN_BASE || '/admin/',
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
