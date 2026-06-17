import express from 'express';
import { getTourStatus, getCurrentLiveTourId } from '../lib/app';
import { writeViewerSnapshot } from '../src/server/db/services';

const app = express();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.VERCEL ? 'vercel' : 'local', timestamp: new Date().toISOString() });
});

app.get('/api/tour-status', async (_req, res) => {
  try {
    const status = await getTourStatus();
    res.json({ data: status });
  } catch (error) {
    res.json({ data: { isLive: false, viewerCount: 0 } });
  }
});

app.get('/api/catalog', async (_req, res) => {
  res.json({ data: [] });
});

app.get('/api/recommended-tours', async (_req, res) => {
  res.json({ data: [] });
});

app.post('/api/tour-requests', async (req, res) => {
  res.json({ data: { ok: true } });
});

app.post('/api/newsletter', async (req, res) => {
  res.json({ data: { ok: true } });
});

export default app;
