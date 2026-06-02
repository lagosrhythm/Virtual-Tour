import 'dotenv/config';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { Duplex } from 'node:stream';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OFFLINE_TOUR_STATUS, type TourStatusSnapshot } from './src/data/liveTour';
import { RECOMMENDED_TOURS } from './src/data/recommendedTours';
import { initializeFirebase, getFirestore } from './src/server/db/firestore';
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
  writeOperationLog,
  getOperationLogs,
  writeViewerSnapshot,
  getAnalyticsSummary,
} from './src/server/db/services';
import { initializeFirestoreData } from './src/server/db/seed';
import { verifyFirebaseToken, requireAdmin, requireAuth, type AuthRequest } from './src/server/auth/middleware';
import { upsertUser, getUserById, getAllAdmins } from './src/server/auth/users';
import type { StreamProvider, LiveTour } from './src/server/db/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('WARNING: Firebase initialization failed. API endpoints will use fallback data.');
}

let currentLiveTourId: string | null = null;
const sockets = new Set<Duplex>();

app.use(helmet({
  contentSecurityPolicy: {
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
  },
}));
app.use(express.json({ limit: '32kb' }));

// Rate limiters for public write endpoints
const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Apply authentication middleware globally (parses tokens but does not require them)
app.use(verifyFirebaseToken);

function jsonOk<T>(data: T) {
  return { data };
}

function isEmail(value: unknown) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Strip HTML tags and null bytes from user-supplied strings
function sanitise(value: unknown, maxLen = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/\0/g, '').trim().slice(0, maxLen);
}

async function getTourStatus(): Promise<TourStatusSnapshot> {
  try {
    const isLive = process.env.LIVE_TOUR_ACTIVE === 'true';

    if (!isLive) {
      return OFFLINE_TOUR_STATUS;
    }

    // Try to fetch from Firestore if available
    try {
      const activeTour = await getActiveLiveTour();
      if (activeTour) {
        currentLiveTourId = activeTour.id;
        
          // Fetch stream provider metadata
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

    // Fallback to environment variables
    return {
      isLive: true,
      viewerCount: Number(process.env.LIVE_TOUR_VIEWERS || 1245),
      tour: {
        title: process.env.LIVE_TOUR_TITLE || 'Live tour',
        shortDescription: process.env.LIVE_TOUR_DESCRIPTION || 'A live Lagos virtual tour is currently broadcasting.',
        hostName: process.env.LIVE_TOUR_HOST || 'Lagos Rhythm',
        startedAtLabel: process.env.LIVE_TOUR_STARTED_LABEL || 'Live now',
        location: process.env.LIVE_TOUR_LOCATION || 'Lagos, Nigeria',
        streamImageUrl: process.env.LIVE_TOUR_STREAM_IMAGE,
        hostImageUrl: process.env.LIVE_TOUR_HOST_IMAGE,
      },
    };
  } catch (error) {
    console.error('Error in getTourStatus:', error);
    return OFFLINE_TOUR_STATUS;
  }
}

app.get('/api/health', (_req, res) => {
  res.json(jsonOk({ ok: true }));
});

// ============ Admin Auth Endpoints ============

/**
 * POST /admin/login
 * Public endpoint for admin login with Firebase Auth token
 * Request body: { token: string } (Firebase ID token)
 * Response: { data: { uid, email, role } }
 */
app.post('/admin/login', async (req: AuthRequest, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

    if (!token) {
      res.status(400).json({ error: 'Firebase ID token is required.' });
      return;
    }

    // Verify the token (this is already done by middleware if it succeeds)
    // The middleware sets req.user if the token is valid
    if (!req.user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    // Ensure user exists in Firestore
    const user = await getUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found. Contact admin to set up account.' });
      return;
    }

    res.json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error('Error in /admin/login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /admin/register
 * Register first admin user (only works if no admins exist)
 * Request body: { token: string } (Firebase ID token)
 * Response: { data: { uid, email, role } }
 */
app.post('/admin/register', async (req: AuthRequest, res) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

    if (!token) {
      res.status(400).json({ error: 'Firebase ID token is required.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }

    // Check if any admins exist
    const existingAdmins = await getAllAdmins();
    if (existingAdmins.length > 0) {
      res.status(403).json({ error: 'Admin registration has already been completed.' });
      return;
    }

    // Create new admin user
    const user = await upsertUser(req.user.uid, req.user.email, 'admin');

    res.status(201).json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error('Error in /admin/register:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * GET /admin/me
 * Get current authenticated user info (requires auth)
 * Response: { data: { uid, email, role } }
 */
app.get('/admin/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await getUserById(req.user.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error('Error in /admin/me:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============ Admin Stream Provider Endpoints ============

/**
 * POST /admin/streams
 * Create a new stream provider (requires admin role)
 * Request body: { type, name, config }
 * Response: { data: StreamProvider }
 */
app.post('/admin/streams', requireAdmin, async (req: AuthRequest, res) => {
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

/**
 * GET /admin/streams
 * List all stream providers (requires admin role)
 * Response: { data: StreamProvider[] }
 */
app.get('/admin/streams', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const providers = await getStreamProviders();
    res.json(jsonOk(providers));
  } catch (error) {
    console.error('Error fetching stream providers:', error);
    res.status(500).json({ error: 'Failed to fetch stream providers' });
  }
});

/**
 * PUT /admin/streams/:id
 * Update a stream provider (requires admin role)
 * Request body: { type?, name?, config? }
 * Response: { data: { ok: true } }
 */
app.put('/admin/streams/:id', requireAdmin, async (req: AuthRequest, res) => {
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

/**
 * DELETE /admin/streams/:id
 * Delete a stream provider (requires admin role)
 * Response: { data: { ok: true } }
 */
app.delete('/admin/streams/:id', requireAdmin, async (_req: AuthRequest, res) => {
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

/**
 * POST /admin/tours
 * Create a new live tour (requires host or admin role)
 * Request body: { streamProviderId, title, shortDescription, hostName, location, metadata? }
 * Response: { data: LiveTour }
 */
app.post('/admin/tours', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { streamProviderId, title, shortDescription, hostName, location, metadata } = req.body;

    if (!streamProviderId || typeof streamProviderId !== 'string') {
      res.status(400).json({ error: 'Stream provider ID is required.' });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length < 1) {
      res.status(400).json({ error: 'Tour title is required.' });
      return;
    }

    // Verify stream provider exists
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
      hostId: req.user.uid,
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

/**
 * GET /admin/tours
 * List live tour history (requires auth)
 * Response: { data: LiveTour[] }
 */
app.get('/admin/tours', requireAuth, async (_req: AuthRequest, res) => {
  try {
    const tours = await getLiveTourHistory(100);
    res.json(jsonOk(tours));
  } catch (error) {
    console.error('Error fetching live tours:', error);
    res.status(500).json({ error: 'Failed to fetch live tours' });
  }
});

/**
 * PUT /admin/tours/:id
 * Update a live tour (requires auth)
 * Request body: { title?, shortDescription?, hostName?, location?, status?, metadata? }
 * Response: { data: { ok: true } }
 */
app.put('/admin/tours/:id', requireAuth, async (_req: AuthRequest, res) => {
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

    // Log admin action
    if (req.user && status) {
      void writeOperationLog({
        userId: req.user.uid,
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

app.get('/admin/catalog', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('catalog_tours').orderBy('createdAt', 'desc').limit(200).get();
    res.json(jsonOk(snapshot.docs.map(d => d.data())));
  } catch (error) {
    console.error('Error fetching catalog tours:', error);
    res.status(500).json({ error: 'Failed to fetch catalog tours' });
  }
});

app.post('/admin/catalog', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, category, duration, description, imageUrl, free, views, trend, visibility } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    const db = getFirestore();
    const docRef = db.collection('catalog_tours').doc();
    const now = new Date();
    const tour = {
      id: docRef.id, title: title.trim(),
      category: category || 'Culture',
      duration: duration || '',
      description: description || '',
      imageUrl: imageUrl || '',
      free: free !== false,
      views: views || '',
      trend: trend || '',
      visibility: visibility || 'public',
      createdAt: now, updatedAt: now,
    };
    await docRef.set(tour);
    res.status(201).json(jsonOk(tour));
  } catch (error) {
    console.error('Error creating catalog tour:', error);
    res.status(500).json({ error: 'Failed to create catalog tour' });
  }
});

app.put('/admin/catalog/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = getFirestore();
    await db.collection('catalog_tours').doc(id).update({ ...req.body, updatedAt: new Date() });
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating catalog tour:', error);
    res.status(500).json({ error: 'Failed to update catalog tour' });
  }
});

app.delete('/admin/catalog/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = getFirestore();
    await db.collection('catalog_tours').doc(id).delete();
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting catalog tour:', error);
    res.status(500).json({ error: 'Failed to delete catalog tour' });
  }
});

// ============ Admin Recommended Tours Endpoints ============

app.post('/admin/recommended-tours', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, host, time, tags, img, rank } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    const { getFirestore, COLLECTIONS } = await import('./src/server/db/firestore');
    const db = getFirestore();
    const docRef = db.collection(COLLECTIONS.recommended_tours).doc();
    const now = new Date();
    await docRef.set({ id: docRef.id, tourId: '', title, host: host || '', time: time || '', tags: tags || [], img: img || '', rank: Number(rank) || 1, free: true, featured: false, createdAt: now, updatedAt: now });
    res.status(201).json(jsonOk({ id: docRef.id }));
  } catch (error) {
    console.error('Error creating recommended tour:', error);
    res.status(500).json({ error: 'Failed to create tour' });
  }
});

app.put('/admin/recommended-tours/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { updateRecommendedTour } = await import('./src/server/db/services');
    await updateRecommendedTour(id, req.body);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating recommended tour:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
});

app.delete('/admin/recommended-tours/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { deleteRecommendedTour } = await import('./src/server/db/services');
    await deleteRecommendedTour(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error deleting recommended tour:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
});

// ============ Admin Analytics & Logs Endpoints ============

app.get('/admin/analytics', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json(jsonOk(summary));
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/logs', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const logs = await getOperationLogs(200);
    res.json(jsonOk(logs));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ============ Admin Tour Requests + Newsletter Endpoints ============

app.get('/admin/tour-requests', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const { getTourRequests } = await import('./src/server/db/services');
    const requests = await getTourRequests(200);
    res.json(jsonOk(requests));
  } catch (error) {
    console.error('Error fetching tour requests:', error);
    res.status(500).json({ error: 'Failed to fetch tour requests' });
  }
});

app.put('/admin/tour-requests/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['new', 'reviewed', 'planned', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    const { updateTourRequestStatus } = await import('./src/server/db/services');
    await updateTourRequestStatus(id, status);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error updating tour request:', error);
    res.status(500).json({ error: 'Failed to update tour request' });
  }
});

app.get('/admin/newsletter', requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const { getNewsletterSubscribers } = await import('./src/server/db/services');
    const subscribers = await getNewsletterSubscribers(1000);
    res.json(jsonOk(subscribers));
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// ============ Public API Endpoints ============

app.get('/api/recommended-tours', async (_req, res) => {
  try {
    // Try Firestore first
    try {
      const tours = await getRecommendedTours(100);
      if (tours.length > 0) {
        return res.json(jsonOk(tours));
      }
    } catch (error) {
      console.warn('Could not fetch from Firestore, using fallback:', error instanceof Error ? error.message : error);
    }

    // Fallback to static data
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

    // Try to save to Firestore
    try {
      await createTourRequest(destination, email);
    } catch (error) {
      console.warn('Could not save to Firestore:', error instanceof Error ? error.message : error);
      // Continue without persistence for now
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

    // Try to save to Firestore
    try {
      await addNewsletterSubscriber(email, 'newsletter_signup');
    } catch (error) {
      console.warn('Could not save to Firestore:', error instanceof Error ? error.message : error);
      // Continue without persistence for now
    }

    res.status(201).json(jsonOk({ ok: true }));
  } catch (error) {
    console.error('Error adding newsletter subscriber:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = http.createServer(app);

function encodeFrame(payload: string) {
  const data = Buffer.from(payload);

  if (data.length < 126) {
    return Buffer.concat([Buffer.from([0x81, data.length]), data]);
  }

  if (data.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
    return Buffer.concat([header, data]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(data.length), 2);
  return Buffer.concat([header, data]);
}

async function sendStatus(socket: Duplex) {
  try {
    const status = await getTourStatus();
    const viewerNoise = status.isLive ? Math.floor(Math.random() * 9) - 4 : 0;
    const payload = {
      ...status,
      viewerCount: Math.max(0, status.viewerCount + viewerNoise),
    };

    socket.write(encodeFrame(JSON.stringify(payload)));
  } catch (error) {
    console.error('Error sending status:', error);
  }
}

server.on('upgrade', (req, socket) => {
  if (req.url !== '/api/live') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');

  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));

  sockets.add(socket);
  sendStatus(socket);

  socket.on('close', () => sockets.delete(socket));
  socket.on('error', () => sockets.delete(socket));
});

setInterval(() => {
  sockets.forEach((socket) => {
    sendStatus(socket).catch((error) => {
      console.error('Error sending status to socket:', error);
    });
  });
}, 5000).unref();

// Write viewer snapshot every 30s when a live tour is active
setInterval(() => {
  if (currentLiveTourId) {
    getTourStatus().then(status => {
      if (status.isLive && currentLiveTourId) {
        void writeViewerSnapshot(currentLiveTourId, status.viewerCount);
      }
    }).catch(() => {});
  }
}, 30_000).unref();

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  app.listen(port, '0.0.0.0', async () => {
    console.log(`Lagos Rhythm listening on http://localhost:${port}`);

    // Initialize Database data (seeds recommended tours if empty)
    try {
      await initializeFirestoreData();
    } catch (error) {
      console.warn('Failed to initialize Database data:', error instanceof Error ? error.message : error);
    }
  });
}

export default app;
