// vite.config.ts
//import { defineConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Exposes the server to your local network
  },
  base: '/Marito/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the PWA when a new version is available
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Marito - Multilingual Lexicons',
        short_name: 'Marito',
        description:
          'A PWA for Multilingual Lexicons, Term Banks, and Glossaries for South African Languages.',
        theme_color: '#00CEAF',
        background_color: '#ffffff', // Background color for splash screen
        display: 'standalone',
        start_url: '/Marito/',
        scope: '/Marito/',
        icons: [
          {
            src: '/icons/DFSI_Logo_192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/DFSI_Logo_512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/maskable_icon_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  define: {
    __PROD__: process.env.NODE_ENV === 'production',
    __API_GATEWAY_URL__: JSON.stringify(
      'https://default-service-885391982107.us-central1.run.app',
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['Tests/**/*.test.tsx'],
    setupFiles: ['./Tests/setup.ts'],
  },
});
