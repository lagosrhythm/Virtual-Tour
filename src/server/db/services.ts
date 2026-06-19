import { COLLECTIONS, getRealtimeDB } from './firestore';
import type {
  TourRequest,
  NewsletterSubscriber,
  LiveTour,
  RecommendedTour,
  CatalogTour,
  StreamProvider,
  HostApplication,
  Host,
} from './types';

// Utility to convert RTDB object to array
function toArray<T>(obj: any): T[] {
  if (!obj) return [];
  return Object.keys(obj).map(key => ({
    ...obj[key],
    createdAt: obj[key].createdAt ? new Date(obj[key].createdAt) : undefined,
    updatedAt: obj[key].updatedAt ? new Date(obj[key].updatedAt) : undefined,
    timestamp: obj[key].timestamp ? new Date(obj[key].timestamp) : undefined,
  }));
}

// ============ Stream Providers ============

export async function createStreamProvider(
  provider: Omit<StreamProvider, 'id' | 'createdAt'>,
): Promise<StreamProvider> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.stream_providers).push();
  const now = new Date();

  const streamProvider: StreamProvider = {
    id: ref.key!,
    ...provider,
    createdAt: now,
  };

  await ref.set({
    ...streamProvider,
    createdAt: now.toISOString(),
  });
  return streamProvider;
}

export async function getStreamProvider(id: string): Promise<StreamProvider | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.stream_providers).child(id).get();
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  return { ...data, createdAt: new Date(data.createdAt) };
}

export async function getStreamProviders(): Promise<StreamProvider[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.stream_providers).get();
  return toArray<StreamProvider>(snapshot.val()).sort((a, b) =>
    (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  );
}

export async function updateStreamProvider(id: string, updates: Partial<StreamProvider>): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.stream_providers).child(id).update(updates);
}

export async function deleteStreamProvider(id: string): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.stream_providers).child(id).remove();
}

// ============ Tour Requests ============

export async function createTourRequest(destination: string, email: string): Promise<TourRequest> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.tour_requests).push();
  const now = new Date();

  const request: TourRequest = {
    id: ref.key!,
    destination,
    email,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...request,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return request;
}

export async function getTourRequests(
  limit = 100,
  status?: 'new' | 'reviewed' | 'planned' | 'rejected',
): Promise<TourRequest[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.tour_requests).get();
  let results = toArray<TourRequest>(snapshot.val());
  if (status) {
    results = results.filter(r => r.status === status);
  }
  return results
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, limit);
}

export async function updateTourRequestStatus(
  id: string,
  status: 'new' | 'reviewed' | 'planned' | 'rejected',
): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.tour_requests).child(id).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}

// ============ Host Applications ============

export async function createHostApplication(
  name: string,
  email: string,
  phone: string,
  experience: string,
): Promise<HostApplication> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.host_applications).push();
  const now = new Date();

  const application: HostApplication = {
    id: ref.key!,
    name,
    email,
    phone,
    experience,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...application,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return application;
}

export async function getHostApplication(id: string): Promise<HostApplication | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.host_applications).child(id).get();
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}

export async function getHostApplications(status?: 'pending' | 'approved' | 'rejected'): Promise<HostApplication[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.host_applications).get();
  let results = toArray<HostApplication>(snapshot.val());
  if (status) {
    results = results.filter(r => r.status === status);
  }
  return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function updateHostApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.host_applications).child(id).update({
    status,
    updatedAt: new Date().toISOString(),
  });
}

// ============ Hosts ============

export async function createHost(
  application: HostApplication,
  passcode: string,
): Promise<Host> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.hosts).push();
  const now = new Date();

  const host: Host = {
    id: ref.key!,
    name: application.name,
    email: application.email,
    phone: application.phone,
    experience: application.experience,
    bio: '',
    profileImage: '',
    passcode,
    status: 'active',
    applicationId: application.id,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...host,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return host;
}

export async function getHostByEmail(email: string): Promise<Host | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.hosts).get();
  const hosts = toArray<Host>(snapshot.val());
  return hosts.find(h => h.email === email.toLowerCase()) ?? null;
}

export async function getHosts(): Promise<Host[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.hosts).get();
  return toArray<Host>(snapshot.val())
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function updateHost(id: string, updates: Partial<Host>): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.hosts).child(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteHost(id: string): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.hosts).child(id).remove();
}

// ============ Newsletter Subscribers ============

export async function addNewsletterSubscriber(
  email: string,
  source: 'welcome_modal' | 'newsletter_signup' | 'other' = 'other',
): Promise<NewsletterSubscriber> {
  const db = getRealtimeDB();
  const normalizedEmail = email.toLowerCase().replace(/\./g, ',');

  const ref = db.ref(COLLECTIONS.newsletter_subscribers).child(normalizedEmail);
  const snapshot = await ref.get();

  if (snapshot.exists()) {
    const existing = snapshot.val() as NewsletterSubscriber;
    if (!existing.subscribed) {
      await ref.update({
        subscribed: true,
        unsubscribedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
    return existing;
  }

  const now = new Date();
  const subscriber: NewsletterSubscriber = {
    id: normalizedEmail,
    email: email.toLowerCase(),
    source,
    subscribed: true,
    createdAt: now,
  };

  await ref.set({
    ...subscriber,
    createdAt: now.toISOString(),
  });
  return subscriber;
}

export async function getNewsletterSubscribers(limit = 1000): Promise<NewsletterSubscriber[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.newsletter_subscribers).get();
  return toArray<NewsletterSubscriber>(snapshot.val())
    .filter(s => s.subscribed)
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, limit);
}

export async function unsubscribeNewsletterSubscriber(email: string): Promise<void> {
  const db = getRealtimeDB();
  const normalizedEmail = email.toLowerCase().replace(/\./g, ',');
  await db.ref(COLLECTIONS.newsletter_subscribers).child(normalizedEmail).update({
    subscribed: false,
    unsubscribedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ============ Recommended Tours ============

export async function getRecommendedTours(limit = 100): Promise<any[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.recommended_tours).get();
  return toArray<any>(snapshot.val())
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, limit);
}

export async function createRecommendedTour(tour: Omit<RecommendedTour, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecommendedTour> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.recommended_tours).push();
  const now = new Date();

  const recommended: RecommendedTour = {
    id: ref.key!,
    ...tour,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...recommended,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return recommended;
}

export async function updateRecommendedTour(id: string, updates: Partial<RecommendedTour>): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.recommended_tours).child(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRecommendedTour(id: string): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.recommended_tours).child(id).remove();
}

// ============ Live Tours ============

export async function getLiveTour(id: string): Promise<LiveTour | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.live_tours).child(id).get();
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  } as LiveTour;
}

export async function getActiveLiveTour(): Promise<LiveTour | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.live_tours).get();
  const tours = toArray<LiveTour>(snapshot.val()).filter(t => t.status === 'live');
  return tours[0] ?? null;
}

export async function createLiveTour(
  tour: Omit<LiveTour, 'id' | 'createdAt' | 'updatedAt' | 'viewerCount'>,
): Promise<LiveTour> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.live_tours).push();
  const now = new Date();

  const liveTour: LiveTour = {
    id: ref.key!,
    ...tour,
    viewerCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...liveTour,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return liveTour;
}

export async function updateLiveTour(id: string, updates: Partial<LiveTour>): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.live_tours).child(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function getLiveTourHistory(limit = 50): Promise<LiveTour[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.live_tours).get();
  return toArray<LiveTour>(snapshot.val())
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, limit);
}

// ============ Catalog Tours ============

export async function getCatalogTours(limit = 100): Promise<CatalogTour[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.catalog_tours).get();
  return toArray<CatalogTour>(snapshot.val())
    .filter(t => t.visibility === 'public')
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, limit);
}

export async function createCatalogTour(tour: Omit<CatalogTour, 'id' | 'createdAt' | 'updatedAt'>): Promise<CatalogTour> {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.catalog_tours).push();
  const now = new Date();

  const catalogTour: CatalogTour = {
    id: ref.key!,
    ...tour,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set({
    ...catalogTour,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
  return catalogTour;
}

export async function updateCatalogTour(id: string, updates: Partial<CatalogTour>): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.catalog_tours).child(id).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCatalogTour(id: string): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.catalog_tours).child(id).remove();
}

// ============ Analytics & Operation Logs ============

export async function writeOperationLog(
  log: Omit<import('./types').OperationLog, 'id' | 'timestamp'>,
): Promise<void> {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.operation_logs).push();
    await ref.set({ ...log, id: ref.key, timestamp: new Date().toISOString() });
  } catch {
    // Logging must never throw
  }
}

export async function getOperationLogs(limit = 100): Promise<import('./types').OperationLog[]> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.operation_logs).get();
  return toArray<import('./types').OperationLog>(snapshot.val())
    .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0))
    .slice(0, limit);
}

export async function writeViewerSnapshot(tourId: string, viewerCount: number): Promise<void> {
  try {
    const db = getRealtimeDB();
    const ref = db.ref('viewer_snapshots').push();
    await ref.set({
      id: ref.key,
      tourId,
      viewerCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to write RTDB snapshot:', error);
  }
}

export async function getAnalyticsSummary(): Promise<{
  totalTourRequests: number;
  totalSubscribers: number;
  totalLiveTours: number;
  totalViewers: number;
  avgViewers: number;
  recentLogs: import('./types').OperationLog[];
}> {
  const db = getRealtimeDB();

  const [reqSnap, subSnap, tourSnap, logSnap] = await Promise.all([
    db.ref(COLLECTIONS.tour_requests).get(),
    db.ref(COLLECTIONS.newsletter_subscribers).get(),
    db.ref(COLLECTIONS.live_tours).get(),
    db.ref(COLLECTIONS.operation_logs).get(),
  ]);

  const reqs = toArray<any>(reqSnap.val());
  const subs = toArray<any>(subSnap.val()).filter(s => s.subscribed);
  const tours = toArray<LiveTour>(tourSnap.val());
  const logs = toArray<import('./types').OperationLog>(logSnap.val())
    .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0))
    .slice(0, 20);

  let totalViewers = 0;
  tours.forEach(t => {
    totalViewers += (t.viewerCount || 0);
  });

  return {
    totalTourRequests: reqs.length,
    totalSubscribers: subs.length,
    totalLiveTours: tours.length,
    totalViewers,
    avgViewers: tours.length > 0 ? Math.round(totalViewers / tours.length) : 0,
    recentLogs: logs,
  };
}
