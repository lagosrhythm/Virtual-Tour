import { type LiveTourDetails } from '../types';

export interface TourStatusSnapshot {
  isLive: boolean;
  viewerCount: number;
  tour: LiveTourDetails | null;
  streamProvider?: {
    type: string;
    name: string;
    config: Record<string, unknown>;
  };
}

export const OFFLINE_TOUR_STATUS: TourStatusSnapshot = {
  isLive: false,
  viewerCount: 0,
  tour: null,
};
