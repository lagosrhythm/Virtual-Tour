import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { OFFLINE_TOUR_STATUS } from './src/data/liveTour';
import { RECOMMENDED_TOURS } from './src/data/recommendedTours';

function jsonResponse(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJsonBody(req: import('node:http').IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 32768) {
        reject(new Error('Request body is too large.'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
  });
}

function isEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function devApiPlugin(): Plugin {
  return {
    name: 'lagos-rhythm-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/recommended-tours', (req, res) => {
        if (req.method !== 'GET') {
          jsonResponse(res, 405, { error: 'Method not allowed.' });
          return;
        }

        jsonResponse(res, 200, { data: [...RECOMMENDED_TOURS].sort((a, b) => a.rank - b.rank) });
      });

      server.middlewares.use('/api/catalog', (req, res) => {
        if (req.method !== 'GET') {
          jsonResponse(res, 405, { error: 'Method not allowed.' });
          return;
        }
        // Return empty so useCatalogTours falls back to static TOURS
        jsonResponse(res, 200, { data: [] });
      });

      server.middlewares.use('/api/tour-status', (req, res) => {
        if (req.method !== 'GET') {
          jsonResponse(res, 405, { error: 'Method not allowed.' });
          return;
        }

        jsonResponse(res, 200, { data: OFFLINE_TOUR_STATUS });
      });

      server.middlewares.use('/api/tour-requests', async (req, res) => {
        if (req.method !== 'POST') {
          jsonResponse(res, 405, { error: 'Method not allowed.' });
          return;
        }

        try {
          const body = await readJsonBody(req);
          const destination = typeof body.destination === 'string' ? body.destination.trim() : '';

          if (destination.length < 3) {
            jsonResponse(res, 400, { error: 'Enter a destination or theme with at least 3 characters.' });
            return;
          }

          if (!isEmail(body.email)) {
            jsonResponse(res, 400, { error: 'Enter a valid email address.' });
            return;
          }

          jsonResponse(res, 201, { data: { ok: true } });
        } catch (error) {
          jsonResponse(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' });
        }
      });

      server.middlewares.use('/api/newsletter', async (req, res) => {
        if (req.method !== 'POST') {
          jsonResponse(res, 405, { error: 'Method not allowed.' });
          return;
        }

        try {
          const body = await readJsonBody(req);

          if (!isEmail(body.email)) {
            jsonResponse(res, 400, { error: 'Enter a valid email address.' });
            return;
          }

          jsonResponse(res, 201, { data: { ok: true } });
        } catch (error) {
          jsonResponse(res, 400, { error: error instanceof Error ? error.message : 'Invalid request.' });
        }
      });
    },
  };
}

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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
