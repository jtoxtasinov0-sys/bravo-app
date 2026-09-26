import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lokal: /api va /uploads so'rovlari backend'ga (5000-port) uzatiladi
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: true, // ngrok manzili ham ochilsin
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
