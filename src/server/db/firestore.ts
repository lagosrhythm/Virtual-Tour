import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getDatabase, type Database } from 'firebase-admin/database';
import fs from 'node:fs';
import path from 'node:path';


const projectRoot = process.cwd();

let rtdb: Database | null = null;
let firebaseAvailable = false;

export function isFirebaseAvailable(): boolean {
  return firebaseAvailable;
}

export function initializeFirebase() {
  if (rtdb) {
    return { rtdb };
  }

  try {
    let serviceAccountKey: Record<string, unknown>;

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
      const serviceAccountKeyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKeyStr) {
        if (process.env.VERCEL) {
          console.warn('⚠ Firebase credentials not found on Vercel. Set FIREBASE_SERVICE_ACCOUNT_KEY env var.');
          return { rtdb: null };
        }
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

    rtdb = getDatabase();
    firebaseAvailable = true;

    console.log('✓ Firebase Realtime Database initialized successfully');
    return { rtdb };
  } catch (error) {
    console.error('✗ Failed to initialize Firebase:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export function getRealtimeDB(): Database {
  if (!rtdb) {
    const result = initializeFirebase();
    if (!result.rtdb) {
      throw new Error('Firebase Realtime Database is not available. Check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    }
    return result.rtdb;
  }
  return rtdb;
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
