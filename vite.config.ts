import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// AI calls go through a Supabase Edge Function (services/aiService.ts), so no
// provider API key is ever bundled into client code. Only the public
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (safe to expose) are read from
// .env.local by Vite automatically.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
