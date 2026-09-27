import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Supabase config. The anon key lives in the JWT env var.
        'process.env.VITE_SUPABASE_URL': JSON.stringify(
          env.VITE_SUPABASE_URL || 'https://tbjsqpntgnkdkmpzaqez.supabase.co'
        ),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
          env.VITE_SUPABASE_ANON_KEY || env.JWT
        ),
        // OAuth redirect target for the current environment.
        'process.env.SUPABASE_REDIRECT_URL': JSON.stringify(
          env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || ''
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
