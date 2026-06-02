import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getDatabase as getRTDB, type Database } from 'firebase-admin/database';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

// Initialize Firebase Admin SDK
let rtdb: Database | null = null;

export function initializeFirebase() {
  if (rtdb) {
    return { rtdb };
  }

  try {
    let serviceAccountKey: Record<string, unknown>;

    // Strategy 1: Try to load from local file
    const keyFilePath = path.join(projectRoot, 'lagos-rhythm-virtual-tour-firebase-adminsdk-fbsvc-6c40080af4.json');
    if (fs.existsSync(keyFilePath)) {
      try {
        const keyFileContent = fs.readFileSync(keyFilePath, 'utf-8');
        serviceAccountKey = JSON.parse(keyFileContent);
        console.log('✓ Loaded Firebase credentials from local file');
      } catch (error) {
        throw new Error(`Failed to read/parse Firebase key file at ${keyFilePath}: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      // Strategy 2: Env var
      const serviceAccountKeyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKeyStr) {
        throw new Error('Firebase credentials missing.');
      }
      try {
        serviceAccountKey = JSON.parse(serviceAccountKeyStr);
      } catch {
        const decoded = Buffer.from(serviceAccountKeyStr, 'base64').toString('utf-8');
        serviceAccountKey = JSON.parse(decoded);
      }
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccountKey as ServiceAccount),
        databaseURL: `https://${serviceAccountKey.project_id}-default-rtdb.firebaseio.com`,
      });
    }

    rtdb = getRTDB();

    console.log('✓ Firebase initialized successfully (Realtime Database Only)');
    return { rtdb };
  } catch (error) {
    console.error('✗ Failed to initialize Firebase:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export function getRealtimeDB(): Database {
  if (!rtdb) return initializeFirebase().rtdb;
  return rtdb;
}

// Alias for backwards compatibility with existing imports
// Now returns RTDB instance instead of Firestore
export function getFirestore(): any {
  return getRealtimeDB();
}

export const COLLECTIONS = {
  users: 'users',
  stream_providers: 'stream_providers',
  live_tours: 'live_tours',
  catalog_tours: 'catalog_tours',
  recommended_tours: 'recommended_tours',
  tour_requests: 'tour_requests',
  newsletter_subscribers: 'newsletter_subscribers',
  viewer_events: 'viewer_events',
  operation_logs: 'operation_logs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
