export interface Tour {
  id: number;
  title: string;
  imgClass: string;
  category: TourCategory;
  duration: string;
  views: string;
  trend?: string;
  isFree?: boolean;
}

// API shape returned by /api/catalog (Firestore-backed)
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

export type TourCategory = "Culture" | "Nature" | "History" | "Entertainment" | "Relaxation" | "Modern" | "All";

export interface ChatMessage {
  user: string;
  msg: string;
  time: string;
  pinned?: boolean;
}

export interface RecommendedTour {
  id: number;
  title: string;
  time: string;
  host: string;
  tags: string[];
  img: string;
  rank: number;
}

export interface LiveTourDetails {
  title: string;
  shortDescription: string;
  hostName?: string;
  startedAtLabel?: string;
  location?: string;
  streamImageUrl?: string;
  hostImageUrl?: string;
}
