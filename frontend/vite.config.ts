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
      injectRegister: 'auto', // Injects the service worker registration script
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2,ttf,eot}',
        ], // Files to precache
        // Runtime caching for API calls - Commented out as APIs are not yet implemented
        /*
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/your-api-domain\.com\/api\//, // Replace with actual API domain when ready
            handler: 'NetworkFirst', // Or 'CacheFirst', 'StaleWhileRevalidate'
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        */
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
      // Enable service worker and PWA features during development
      devOptions: {
        enabled: true,
        type: 'module',
        /* when using certificate based on `mkcert` for development */
        // navigateFallbackAllowlist: [/^\/$/], // Example: only allow root path for SPA fallback
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['Tests/**/*.test.tsx'],
  },
});
