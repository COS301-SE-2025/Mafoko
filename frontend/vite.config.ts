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
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2,ttf,eot}',
        ], // Files to precache
        // Runtime caching for API calls
        runtimeCaching: [
          // Glossary service endpoints - Cache first for stable data
          {
            urlPattern:
              /^https?:\/\/.*\/api\/v1\/glossary\/(categories|languages)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'glossary-static-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Glossary terms - Network first for fresh data, fallback to cache
          {
            urlPattern:
              /^https?:\/\/.*\/api\/v1\/glossary\/(search|terms|categories\/.*\/terms)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'glossary-terms-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 3,
            },
          },
          // Term translations - Cache first for stable translations
          {
            urlPattern:
              /^https?:\/\/.*\/api\/v1\/glossary\/terms\/.*\/translations$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'translations-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Workspace bookmarks - Network first for user data
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/workspace\/bookmarks/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'workspace-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 3,
            },
          },
          // General API fallback
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
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
  ssr: {
    noExternal: ['three', 'three-forcegraph', 'three-spritetext'],
  },
  optimizeDeps: {
    include: ['three', 'three-forcegraph', 'three-spritetext'],
  },
  build: {
    commonjsOptions: {
      include: [/three-forcegraph/, /three-spritetext/, /node_modules/],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['Tests/**/*.test.tsx'],
    setupFiles: ['./Tests/setup.ts'],
  },
});
