import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OFFLINE_TOUR_STATUS, type TourStatusSnapshot } from '../src/data/liveTour';
import { RECOMMENDED_TOURS } from '../src/data/recommendedTours';
import { initializeFirebase, getRealtimeDB, COLLECTIONS, isFirebaseAvailable } from '../src/server/db/firestore';
import {
  createTourRequest,
  addNewsletterSubscriber,
  getRecommendedTours,
  getActiveLiveTour,
  updateLiveTour,
  createStreamProvider,
  getStreamProvider,
  getStreamProviders,
  updateStreamProvider,
  deleteStreamProvider,
  createLiveTour,
  getLiveTourHistory,
  getCatalogTours,
  createCatalogTour,
  updateCatalogTour,
  deleteCatalogTour,
  writeOperationLog,
  getOperationLogs,
  writeViewerSnapshot,
  getAnalyticsSummary,
} from '../src/server/db/services';
import type { StreamProvider, LiveTour } from '../src/server/db/types';

const app = express();

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('WARNING: Firebase initialization failed. API endpoints will use fallback data.');
}

let currentLiveTourId: string | null = null;

app.use(helmet({
  contentSecurityPolicy: process.env.VERCEL ? {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://firebasestorage.googleapis.com", "*.googleusercontent.com"],
      "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"],
      "connect-src": ["'self'", "*.googleapis.com", "wss:", "ws:"],
    },
  } : false,
}));
app.use(express.json({ limit: '32kb' }));

// CORS for local dev and production
if (!process.env.VERCEL) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
      /^https?:\/\/.*\.vercel\.app$/,
      /^https?:\/\/152\.67\.149\.134(:\d+)?$/,
    ];
    if (origin && allowedOrigins.some(re => re.test(origin))) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Headers', 'X-Admin-Passcode, Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });
}

// Rate limiters for public write endpoints
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Admin passcode middleware
const ADMIN_PASSCODE = process.env.VITE_ADMIN_PASSCODE || '';

function requireAdminPasscode(req: express.Request, res: express.Response, next: express.NextFunction) {
  const passcode = req.headers['x-admin-passcode'];
  if (!passcode || passcode !== ADMIN_PASSCODE) {
    res.status(401).json({ error: 'Invalid or missing admin passcode.' });
    return;
  }
  next();
}

function requireFirebaseMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!isFirebaseAvailable()) {
    res.status(503).json({ error: 'Database not configured. Add the Firebase service account file to the project root.' });
    return;
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: process.env.VERCEL ? 'vercel' : 'local', timestamp: new Date().toISOString() });
});

function jsonOk<T>(data: T) {
  return { data };
}

function isEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitise(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim().slice(0, maxLen);
}

export async function getTourStatus(): Promise<TourStatusSnapshot> {
  try {
    try {
      const activeTour = await getActiveLiveTour();
      if (activeTour) {
        currentLiveTourId = activeTour.id;

        let streamProvider = null;
        try {
          streamProvider = await getStreamProvider(activeTour.streamProviderId);
        } catch (err) {
          console.warn('Could not fetch stream provider:', err instanceof Error ? err.message : err);
        }

        return {
          isLive: true,
          viewerCount: activeTour.viewerCount,
          tour: {
            title: activeTour.title,
            shortDescription: activeTour.shortDescription,
            hostName: activeTour.hostName,
            startedAtLabel: 'Live now',
            location: activeTour.location,
            streamImageUrl: activeTour.metadata?.imageUrl,
            hostImageUrl: activeTour.metadata?.hostImageUrl,
          },
          streamProvider: streamProvider ? {
            type: streamProvider.type,
            name: streamProvider.name,
            config: streamProvider.config,
          } : undefined,
        };
      }
    } catch (error) {
      console.warn('Could not fetch from Firestore, using env vars:', error instanceof Error ? error.message : error);
    }

    const envLive = process.env.LIVE_TOUR_ACTIVE === 'true';
    if (envLive) {
      return {
        isLive: true,
        viewerCount: Number(process.env.LIVE_TOUR_VIEWERS || 1245),
        tour: {
          title: process.env.LIVE_TOUR_TITLE || 'Live tour',
          shortDescription: process.env.LIVE_TOUR_DESCRIPTION || 'A live virtual tour of Lagos is currently broadcasting.',
          hostName: process.env.LIVE_TOUR_HOST || 'Lagos Rhythm',
          startedAtLabel: 'Live now',
          location: process.env.LIVE_TOUR_LOCATION || 'Lagos, Nigeria',
          streamImageUrl: process.env.LIVE_TOUR_STREAM_IMAGE,
          hostImageUrl: process.env.LIVE_TOUR_HOST_IMAGE,
        },
      };
    }

    return OFFLINE_TOUR_STATUS;
  } catch (error) {
    console.error('Error in getTourStatus:', error);
    return OFFLINE_TOUR_STATUS;
  }
}

export function getCurrentLiveTourId(): string | null {
  return currentLiveTourId;
}

// ============ Admin Stream Provider Endpoints ============

app.post('/admin/streams', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { type, name, config } = req.body;

    if (!['youtube', 'mux', 'cloudflare', 'manual_hls', 'browser_webrtc'].includes(type)) {
      res.status(400).json({ error: 'Invalid stream provider type.' });
      return;
    }

    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      res.status(400).json({ error: 'Stream provider name is required.' });
      return;
    }

    const provider = await createStreamProvider({
      type,
      name: name.trim(),
      config: config || {},
    });

    res.status(201).json(jsonOk(provider));
  } catch (error) {
    console.error('Error creating stream provider:', error);
    res.status(500).json({ error: 'Failed to create stream provider' });
  }
});

app.get('/admin/streams', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const providers = await getStreamProviders();
    res.json(jsonOk(providers));
  } catch (error) {
    console.error('Error fetching stream providers:', error);
    res.status(500).json({ error: 'Failed to fetch stream providers' });
  }
});

app.put('/admin/streams/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const { type, name, config } = req.body;

    const provider = await getStreamProvider(id);
    if (!provider) {
      res.status(404).json({ error: 'Stream provider not found.' });
      return;
    }

    const updates: Partial<StreamProvider> = {};
    if (type) {
      if (!['youtube', 'mux', 'cloudflare', 'manual_hls', 'browser_webrtc'].includes(type)) {
        res.status(400).json({ error: 'Invalid stream provider type.' });
        return;
      }
      updates.type = type;
    }
    if (name) {
      updates.name = name.trim();
    }
    if (config) {
      updates.config = config;
    }

    await updateStreamProvider(id, updates);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating stream provider:', error);
    res.status(500).json({ error: 'Failed to update stream provider' });
  }
});

app.delete('/admin/streams/:id', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const { id } = _req.params;

    const provider = await getStreamProvider(id);
    if (!provider) {
      res.status(404).json({ error: 'Stream provider not found.' });
      return;
    }

    await deleteStreamProvider(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting stream provider:', error);
    res.status(500).json({ error: 'Failed to delete stream provider' });
  }
});

// ============ Admin Live Tour Endpoints ============

app.post('/admin/tours', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { streamProviderId, title, shortDescription, hostName, location, metadata } = req.body;

    if (!streamProviderId || typeof streamProviderId !== 'string') {
      res.status(400).json({ error: 'Stream provider ID is required.' });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length < 1) {
      res.status(400).json({ error: 'Tour title is required.' });
      return;
    }

    const provider = await getStreamProvider(streamProviderId);
    if (!provider) {
      res.status(404).json({ error: 'Stream provider not found.' });
      return;
    }

    const tour = await createLiveTour({
      streamProviderId,
      title: title.trim(),
      shortDescription: (shortDescription || '').trim(),
      hostName: (hostName || 'Host').trim(),
      hostId: 'admin',
      location: (location || '').trim(),
      status: 'draft',
      metadata: metadata || {},
    });

    res.status(201).json(jsonOk(tour));
  } catch (error) {
    console.error('Error creating live tour:', error);
    res.status(500).json({ error: 'Failed to create live tour' });
  }
});

app.get('/admin/tours', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const tours = await getLiveTourHistory(100);
    res.json(jsonOk(tours));
  } catch (error) {
    console.error('Error fetching live tours:', error);
    res.status(500).json({ error: 'Failed to fetch live tours' });
  }
});

app.put('/admin/tours/:id', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const { id } = _req.params;
    const { title, shortDescription, hostName, location, status, metadata } = _req.body;

    const updates: Partial<LiveTour> = {};

    if (title) {
      updates.title = title.trim();
    }
    if (shortDescription !== undefined) {
      updates.shortDescription = (shortDescription || '').trim();
    }
    if (hostName) {
      updates.hostName = hostName.trim();
    }
    if (location !== undefined) {
      updates.location = (location || '').trim();
    }
    if (status) {
      if (!['draft', 'scheduled', 'live', 'ended'].includes(status)) {
        res.status(400).json({ error: 'Invalid tour status.' });
        return;
      }
      updates.status = status;
    }
    if (metadata) {
      updates.metadata = metadata;
    }

    await updateLiveTour(id, updates);

    if (status) {
      void writeOperationLog({
        userId: 'admin',
        action: status === 'live' ? 'tour_go_live' : status === 'ended' ? 'tour_end' : 'tour_update',
        resourceType: 'live_tour',
        resourceId: id,
        changes: updates,
        status: 'success',
      });
    }

    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating live tour:', error);
    res.status(500).json({ error: 'Failed to update live tour' });
  }
});

app.delete('/admin/tours/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const db = getRealtimeDB();
    await db.ref(COLLECTIONS.live_tours).child(id).remove();
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting live tour:', error);
    res.status(500).json({ error: 'Failed to delete live tour' });
  }
});

// ============ Public Catalog Endpoint ============

app.get('/api/catalog', async (_req, res) => {
  try {
    const tours = await getCatalogTours(100);
    res.json(jsonOk(tours));
  } catch (error) {
    console.warn('Catalog fetch failed, returning empty:', error instanceof Error ? error.message : error);
    res.json(jsonOk([]));
  }
});

// ============ Admin Catalog Endpoints ============

app.get('/admin/catalog', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const db = getRealtimeDB();
    const snapshot = await db.ref(COLLECTIONS.catalog_tours).get();
    const data = snapshot.val();
    const tours = data ? Object.keys(data).map(k => ({ ...data[k], id: k })) : [];
    tours.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(jsonOk(tours));
  } catch (error) {
    console.error('Error fetching catalog tours:', error);
    res.status(500).json({ error: 'Failed to fetch catalog tours' });
  }
});

app.post('/admin/catalog', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { title, category, duration, description, imageUrl, free, views, trend, visibility } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    const tour = await createCatalogTour({
      title: title.trim(),
      category: category || 'Culture',
      duration: duration || '',
      description: description || '',
      imageUrl: imageUrl || '',
      free: free !== false,
      views: views || '',
      trend: trend || '',
      visibility: visibility || 'public',
    });
    res.status(201).json(jsonOk(tour));
  } catch (error) {
    console.error('Error creating catalog tour:', error);
    res.status(500).json({ error: 'Failed to create catalog tour' });
  }
});

app.put('/admin/catalog/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    await updateCatalogTour(id, req.body);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating catalog tour:', error);
    res.status(500).json({ error: 'Failed to update catalog tour' });
  }
});

app.delete('/admin/catalog/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    await deleteCatalogTour(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting catalog tour:', error);
    res.status(500).json({ error: 'Failed to delete catalog tour' });
  }
});

// ============ Admin Recommended Tours Endpoints ============

app.post('/admin/recommended-tours', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { title, host, time, tags, img, rank } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.recommended_tours).push();
    const now = new Date().toISOString();
    await ref.set({ id: ref.key, tourId: '', title, host: host || '', time: time || '', tags: tags || [], img: img || '', rank: Number(rank) || 1, free: true, featured: false, createdAt: now, updatedAt: now });
    res.status(201).json(jsonOk({ id: ref.key }));
  } catch (error) {
    console.error('Error creating recommended tour:', error);
    res.status(500).json({ error: 'Failed to create tour' });
  }
});

app.put('/admin/recommended-tours/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const { updateRecommendedTour } = await import('../src/server/db/services');
    await updateRecommendedTour(id, req.body);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating recommended tour:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

app.delete('/admin/recommended-tours/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const { deleteRecommendedTour } = await import('../src/server/db/services');
    await deleteRecommendedTour(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting recommended tour:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

// ============ Admin Analytics & Logs Endpoints ============

app.get('/admin/analytics', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json(jsonOk(summary));
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/logs', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const logs = await getOperationLogs(200);
    res.json(jsonOk(logs));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ============ Admin Tour Requests + Newsletter Endpoints ============

app.get('/admin/tour-requests', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const { getTourRequests } = await import('../src/server/db/services');
    const requests = await getTourRequests(200);
    res.json(jsonOk(requests));
  } catch (error) {
    console.error('Error fetching tour requests:', error);
    res.status(500).json({ error: 'Failed to fetch tour requests' });
  }
});

app.put('/admin/tour-requests/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['new', 'reviewed', 'planned', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    const { updateTourRequestStatus } = await import('../src/server/db/services');
    await updateTourRequestStatus(id, status);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating tour request:', error);
    res.status(500).json({ error: 'Failed to update tour request' });
  }
});

app.get('/admin/newsletter', requireAdminPasscode, requireFirebaseMiddleware, async (_req: express.Request, res) => {
  try {
    const { getNewsletterSubscribers } = await import('../src/server/db/services');
    const subscribers = await getNewsletterSubscribers(1000);
    res.json(jsonOk(subscribers));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

app.delete('/admin/newsletter/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const db = getRealtimeDB();
    await db.ref(COLLECTIONS.newsletter_subscribers).child(id).remove();
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

app.delete('/admin/tour-requests/:id', requireAdminPasscode, requireFirebaseMiddleware, async (req: express.Request, res) => {
  try {
    const { id } = req.params;
    const db = getRealtimeDB();
    await db.ref(COLLECTIONS.tour_requests).child(id).remove();
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting tour request:', error);
    res.status(500).json({ error: 'Failed to delete tour request' });
  }
});

// ============ Public API Endpoints ============

app.get('/api/recommended-tours', async (_req, res) => {
  try {
    try {
      const tours = await getRecommendedTours(100);
      if (tours.length > 0) {
        return res.json(jsonOk(tours));
      }
    } catch (error) {
      console.warn('Could not fetch from Firestore, using fallback:', error instanceof Error ? error.message : error);
    }

    res.json(jsonOk([...RECOMMENDED_TOURS].sort((a, b) => a.rank - b.rank)));
  } catch (error) {
    console.error('Error fetching recommended tours:', error);
    res.json(jsonOk([...RECOMMENDED_TOURS].sort((a, b) => a.rank - b.rank)));
  }
});

app.get('/api/tour-status', async (_req, res) => {
  try {
    const status = await getTourStatus();
    res.json(jsonOk(status));
  } catch (error) {
    console.error('Error fetching tour status:', error);
    res.json(jsonOk(OFFLINE_TOUR_STATUS));
  }
});

app.post('/api/tour-requests', publicFormLimiter, async (req, res) => {
  try {
    const destination = sanitise(req.body?.destination, 200);
    const email = sanitise(req.body?.email, 254).toLowerCase();

    if (destination.length < 3) {
      res.status(400).json({ error: 'Enter a destination or theme with at least 3 characters.' });
      return;
    }

    if (!isEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    try {
      await createTourRequest(destination, email);
    } catch (error) {
      console.warn('Could not save to Firestore:', error instanceof Error ? error.message : error);
    }

    res.status(201).json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error creating tour request:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/newsletter', publicFormLimiter, async (req, res) => {
  try {
    const email = sanitise(req.body?.email, 254).toLowerCase();

    if (!isEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    try {
      await addNewsletterSubscriber(email, 'newsletter_signup');
    } catch (error) {
      console.warn('Could not save to Firestore:', error instanceof Error ? error.message : error);
    }

    res.status(201).json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error adding newsletter subscriber:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

export default app;
