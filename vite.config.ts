import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';


function devApiPlugin(): Plugin {
  return {
    name: 'lagos-rhythm-dev-api',
    configureServer() {
      // All /api/* and /admin/* routes are proxied to Express on port 3001.
      // No hardcoded middleware — the proxy in server.proxy handles forwarding.
    },
  };
}

/// <reference types="vitest/config" />
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('hls.js')) return 'hls';
            if (id.includes('src/components/admin')) return 'admin';
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion';
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          ws: true,
        },
        '/admin/streams': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/tours': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/catalog': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/recommended-tours': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/tour-requests': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/newsletter': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/analytics': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/admin/logs': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
