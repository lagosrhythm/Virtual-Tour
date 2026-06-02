import { type RecommendedTour } from '../types';

export interface ApiResult<T> {
  data: T;
}

export interface RequestTourInput {
  destination: string;
  email: string;
}

export interface NewsletterInput {
  email: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    let message = fallback;

    try {
      const body = await response.json() as { error?: string };
      message = body.error ?? fallback;
    } catch {
      message = fallback;
    }

    throw new Error(message);
  }

  if (!contentType.includes('application/json')) {
    throw new Error('API endpoint returned HTML instead of JSON. Start the production server or use the Vite dev API middleware.');
  }

  return response.json() as Promise<T>;
}

export async function getRecommendedTours() {
  const result = await request<ApiResult<RecommendedTour[]>>('/api/recommended-tours');
  return result.data;
}

export async function submitTourRequest(input: RequestTourInput) {
  return request<ApiResult<{ ok: true }>>('/api/tour-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function subscribeToNewsletter(input: NewsletterInput) {
  return request<ApiResult<{ ok: true }>>('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============ Admin Auth ============

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'host' | 'viewer';
}

export async function adminLogin(token: string) {
  return request<ApiResult<AdminUser>>('/admin/login', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ token }),
  });
}

export async function getAdminMe(token: string) {
  return request<ApiResult<AdminUser>>('/admin/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Admin Stream Providers ============

export interface StreamProvider {
  id: string;
  type: 'youtube' | 'mux' | 'cloudflare' | 'manual_hls' | 'browser_webrtc';
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}

export async function getStreamProviders(token: string) {
  return request<ApiResult<StreamProvider[]>>('/admin/streams', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createStreamProvider(
  token: string,
  data: { type: StreamProvider['type']; name: string; config: Record<string, unknown> },
) {
  return request<ApiResult<StreamProvider>>('/admin/streams', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateStreamProvider(
  token: string,
  id: string,
  data: Partial<{ type: StreamProvider['type']; name: string; config: Record<string, unknown> }>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/streams/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function deleteStreamProvider(token: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/streams/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Admin Live Tours ============

export interface LiveTourRecord {
  id: string;
  streamProviderId: string;
  title: string;
  shortDescription: string;
  hostName: string;
  location: string;
  status: 'draft' | 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  metadata?: {
    youtubeVideoId?: string;
    playbackUrl?: string;
    streamKey?: string;
    ingestUrl?: string;
    imageUrl?: string;
    hostImageUrl?: string;
  };
  createdAt: string;
}

export async function getLiveTours(token: string) {
  return request<ApiResult<LiveTourRecord[]>>('/admin/tours', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createLiveTour(
  token: string,
  data: {
    streamProviderId: string;
    title: string;
    shortDescription: string;
    hostName: string;
    location: string;
    metadata?: LiveTourRecord['metadata'];
  },
) {
  return request<ApiResult<LiveTourRecord>>('/admin/tours', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function updateLiveTour(
  token: string,
  id: string,
  data: Partial<Omit<LiveTourRecord, 'id' | 'createdAt'>>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/tours/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// ============ Admin Tour Requests ============

export interface TourRequest {
  id: string;
  destination: string;
  email: string;
  status: 'new' | 'reviewed' | 'planned' | 'rejected';
  createdAt: string;
}

export async function getTourRequests(token: string) {
  return request<ApiResult<TourRequest[]>>('/admin/tour-requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateTourRequestStatus(
  token: string,
  id: string,
  status: TourRequest['status'],
) {
  return request<ApiResult<{ ok: true }>>(`/admin/tour-requests/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

// ============ Admin Newsletter ============

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  subscribed: boolean;
  createdAt: string;
}

export async function getNewsletterSubscribers(token: string) {
  return request<ApiResult<NewsletterSubscriber[]>>('/admin/newsletter', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Public Catalog ============

export interface CatalogTourApi {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  imageUrl: string;
  free: boolean;
  views?: string;
  trend?: string;
  visibility: 'public' | 'draft' | 'archived';
}

export async function getCatalogTours() {
  return request<ApiResult<CatalogTourApi[]>>('/api/catalog');
}

// ============ Admin Catalog ============

export async function adminGetCatalogTours(token: string) {
  return request<ApiResult<CatalogTourApi[]>>('/admin/catalog', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCreateCatalogTour(
  token: string,
  data: Omit<CatalogTourApi, 'id'>,
) {
  return request<ApiResult<CatalogTourApi>>('/admin/catalog', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCatalogTour(
  token: string,
  id: string,
  data: Partial<Omit<CatalogTourApi, 'id'>>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/catalog/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCatalogTour(token: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/catalog/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============ Admin Analytics ============

export interface OperationLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalTourRequests: number;
  totalSubscribers: number;
  totalLiveTours: number;
  totalViewers: number;
  avgViewers: number;
  recentLogs: OperationLog[];
}

export async function getAnalyticsSummary(token: string) {
  return request<ApiResult<AnalyticsSummary>>('/admin/analytics', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getOperationLogs(token: string) {
  return request<ApiResult<OperationLog[]>>('/admin/logs', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
