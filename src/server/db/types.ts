// Firestore Document Types

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  role: 'admin' | 'host' | 'viewer';
  displayName?: string;
}

export interface StreamProvider {
  id: string;
  type: 'youtube' | 'mux' | 'cloudflare' | 'manual_hls' | 'browser_webrtc';
  name: string;
  config: Record<string, unknown>;
  createdAt: Date;
}

export interface LiveTour {
  id: string;
  streamProviderId: string;
  title: string;
  shortDescription: string;
  hostName: string;
  hostId: string;
  location: string;
  startedAt?: Date;
  endedAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogTour {
  id: string;
  title: string;
  category: string;
  duration: number;
  description: string;
  imageUrl: string;
  free: boolean;
  views?: string;
  trend?: string;
  visibility: 'public' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendedTour {
  id: string;
  tourId: string; // Reference to CatalogTour or LiveTour
  title: string;
  imageUrl: string;
  duration: number;
  free: boolean;
  featured: boolean;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TourRequest {
  id: string;
  destination: string;
  email: string;
  status: 'new' | 'reviewed' | 'planned' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: 'welcome_modal' | 'newsletter_signup' | 'other';
  subscribed: boolean;
  createdAt: Date;
  unsubscribedAt?: Date;
}

export interface ViewerEvent {
  id: string;
  tourId: string;
  eventType: 'join' | 'leave' | 'chat_message' | 'reaction';
  viewerId: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export interface OperationLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
}

export interface ViewerSnapshot {
  id: string;
  tourId: string;
  viewerCount: number;
  timestamp: Date;
}
