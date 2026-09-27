import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin panel /admin/ manzilida ishlaydi (backend build'ni shu yo'lda ko'rsatadi).
// Vercel'da (VERCEL=1) alohida domenda ildizdan ochiladi. Qo'lda: ADMIN_BASE=/
export default defineConfig({
  base: process.env.ADMIN_BASE || (process.env.VERCEL ? '/' : '/admin/'),
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
