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

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
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
    throw new Error('API endpoint returned HTML instead of JSON.');
  }

  return response.json() as Promise<T>;
}

function adminHeaders(passcode: string) {
  return { 'X-Admin-Passcode': passcode };
}

export async function getRecommendedTours() {
  const result = await request<ApiResult<RecommendedTour[]>>('/api/recommended-tours');
  return result.data;
}

// ============ Admin Recommended Tours ============

export interface AdminRecommendedTourInput {
  title: string;
  host: string;
  time: string;
  tags: string[];
  img: string;
  rank: number;
}

export async function adminCreateRecommendedTour(passcode: string, data: AdminRecommendedTourInput) {
  return request<ApiResult<{ id: string }>>('/admin/recommended-tours', {
    method: 'POST',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateRecommendedTour(
  passcode: string,
  id: string | number,
  data: Partial<AdminRecommendedTourInput>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/recommended-tours/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteRecommendedTour(passcode: string, id: string | number) {
  return request<ApiResult<{ ok: true }>>(`/admin/recommended-tours/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(passcode),
  });
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

export interface HostApplicationInput {
  name: string;
  email: string;
  phone: string;
  experience: string;
}

export async function submitHostApplication(input: HostApplicationInput) {
  return request<ApiResult<{ ok: true }>>('/api/host-applications', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ============ Host Auth ============

export interface HostData {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  bio: string;
  profileImage: string;
  status: 'active' | 'suspended';
  applicationId: string;
  createdAt: string;
}

export async function hostLogin(email: string, passcode: string) {
  return request<ApiResult<HostData>>('/api/auth/host-login', {
    method: 'POST',
    body: JSON.stringify({ email, passcode }),
  });
}

// ============ Admin Host Applications ============

export interface HostApplicationRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export async function adminGetHostApplications(passcode: string) {
  return request<ApiResult<HostApplicationRecord[]>>('/admin/host-applications', {
    headers: adminHeaders(passcode),
  });
}

export async function adminApproveHostApplication(passcode: string, id: string) {
  return request<ApiResult<{ hostId: string; passcode: string }>>(`/admin/host-applications/${id}/approve`, {
    method: 'POST',
    headers: adminHeaders(passcode),
  });
}

export async function adminRejectHostApplication(passcode: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/host-applications/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders(passcode),
  });
}

// ============ Admin Hosts ============

export interface AdminHostRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  bio: string;
  profileImage: string;
  status: 'active' | 'suspended';
  applicationId: string;
  createdAt: string;
}

export async function adminGetHosts(passcode: string) {
  return request<ApiResult<AdminHostRecord[]>>('/admin/hosts', {
    headers: adminHeaders(passcode),
  });
}

export async function adminUpdateHost(passcode: string, id: string, data: Partial<Pick<AdminHostRecord, 'status' | 'bio' | 'profileImage'>>) {
  return request<ApiResult<{ ok: true }>>(`/admin/hosts/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteHost(passcode: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/hosts/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(passcode),
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

export async function getStreamProviders(passcode: string) {
  return request<ApiResult<StreamProvider[]>>('/admin/streams', {
    headers: adminHeaders(passcode),
  });
}

export async function createStreamProvider(
  passcode: string,
  data: { type: StreamProvider['type']; name: string; config: Record<string, unknown> },
) {
  return request<ApiResult<StreamProvider>>('/admin/streams', {
    method: 'POST',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function updateStreamProvider(
  passcode: string,
  id: string,
  data: Partial<{ type: StreamProvider['type']; name: string; config: Record<string, unknown> }>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/streams/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function deleteStreamProvider(passcode: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/streams/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(passcode),
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

export async function getLiveTours(passcode: string) {
  return request<ApiResult<LiveTourRecord[]>>('/admin/tours', {
    headers: adminHeaders(passcode),
  });
}

export async function createLiveTour(
  passcode: string,
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
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function updateLiveTour(
  passcode: string,
  id: string,
  data: Partial<Omit<LiveTourRecord, 'id' | 'createdAt'>>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/tours/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
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

export async function getTourRequests(passcode: string) {
  return request<ApiResult<TourRequest[]>>('/admin/tour-requests', {
    headers: adminHeaders(passcode),
  });
}

export async function updateTourRequestStatus(
  passcode: string,
  id: string,
  status: TourRequest['status'],
) {
  return request<ApiResult<{ ok: true }>>(`/admin/tour-requests/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
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

export async function getNewsletterSubscribers(passcode: string) {
  return request<ApiResult<NewsletterSubscriber[]>>('/admin/newsletter', {
    headers: adminHeaders(passcode),
  });
}

// ============ Host Dashboard API ============

export async function hostGetMyTours(passcode: string) {
  return request<ApiResult<LiveTourRecord[]>>('/host/my-tours', {
    headers: { 'X-Host-Passcode': passcode },
  });
}

export async function hostCreateTour(
  passcode: string,
  data: {
    title: string;
    shortDescription?: string;
    location?: string;
    streamProviderId: string;
    metadata?: LiveTourRecord['metadata'];
  },
) {
  return request<ApiResult<LiveTourRecord>>('/host/tours', {
    method: 'POST',
    headers: { 'X-Host-Passcode': passcode },
    body: JSON.stringify(data),
  });
}

export async function hostGetStreamProviders(passcode: string) {
  return request<ApiResult<StreamProvider[]>>('/host/streams', {
    headers: { 'X-Host-Passcode': passcode },
  });
}

export async function hostUpdateTour(
  passcode: string,
  id: string,
  data: Partial<Omit<LiveTourRecord, 'id' | 'createdAt'>>,
) {
  return request<ApiResult<{ ok: true }>>(`/host/tours/${id}`, {
    method: 'PUT',
    headers: { 'X-Host-Passcode': passcode },
    body: JSON.stringify(data),
  });
}

export async function hostDeleteTour(passcode: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/host/tours/${id}`, {
    method: 'DELETE',
    headers: { 'X-Host-Passcode': passcode },
  });
}

export async function hostUpdateProfile(
  passcode: string,
  data: { bio?: string; profileImage?: string },
) {
  return request<ApiResult<{ ok: true }>>('/host/profile', {
    method: 'PUT',
    headers: { 'X-Host-Passcode': passcode },
    body: JSON.stringify(data),
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

export async function adminGetCatalogTours(passcode: string) {
  return request<ApiResult<CatalogTourApi[]>>('/admin/catalog', {
    headers: adminHeaders(passcode),
  });
}

export async function adminCreateCatalogTour(
  passcode: string,
  data: Omit<CatalogTourApi, 'id'>,
) {
  return request<ApiResult<CatalogTourApi>>('/admin/catalog', {
    method: 'POST',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCatalogTour(
  passcode: string,
  id: string,
  data: Partial<Omit<CatalogTourApi, 'id'>>,
) {
  return request<ApiResult<{ ok: true }>>(`/admin/catalog/${id}`, {
    method: 'PUT',
    headers: adminHeaders(passcode),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCatalogTour(passcode: string, id: string) {
  return request<ApiResult<{ ok: true }>>(`/admin/catalog/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(passcode),
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

export async function getAnalyticsSummary(passcode: string) {
  return request<ApiResult<AnalyticsSummary>>('/admin/analytics', {
    headers: adminHeaders(passcode),
  });
}

export async function getOperationLogs(passcode: string) {
  return request<ApiResult<OperationLog[]>>('/admin/logs', {
    headers: adminHeaders(passcode),
  });
}
