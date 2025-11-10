import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'AI WordPress Marketing Automator',
          short_name: 'WP Automator',
          description:
            'אוטומציה חכמה ליצירת תוכן שיווקי עם AI לאתרי WordPress',
          theme_color: '#6366f1',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'tailwind-cdn',
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
              },
            },
          ],
        },
      }),
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env['API_KEY']),
      'process.env.GEMINI_API_KEY': JSON.stringify(env['API_KEY']),
      'process.env.VITE_ENCRYPTION_KEY': JSON.stringify(
        env['VITE_ENCRYPTION_KEY'] || 'default-key-change-in-production'
      ),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@/components': path.resolve(__dirname, './components'),
        '@/services': path.resolve(__dirname, './services'),
        '@/types': path.resolve(__dirname, './types.ts'),
      },
    },

    build: {
      target: 'es2022',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'google-genai': ['@google/genai'],
            'ui-vendor': [
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-progress',
              '@radix-ui/react-tooltip',
            ],
            'state-vendor': ['zustand', '@tanstack/react-query', 'immer'],
            'utils-vendor': [
              'date-fns',
              'crypto-js',
              'dompurify',
              'zod',
              'clsx',
              'tailwind-merge',
            ],
            animation: ['framer-motion'],
            charts: ['recharts'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
      sourcemap: mode === 'development',
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@google/genai',
        'zustand',
        '@tanstack/react-query',
      ],
    },

    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
  };
});
