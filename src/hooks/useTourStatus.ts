import { useEffect, useMemo, useRef, useState } from 'react';
import { LiveTourDetails } from '../types';

interface StreamProviderInfo {
  type: 'youtube' | 'mux' | 'cloudflare' | 'manual_hls' | 'browser_webrtc';
  name: string;
  config: Record<string, unknown>;
}

interface TourStatusState {
  isLive: boolean;
  viewerCount: number;
  tour: LiveTourDetails | null;
  streamProvider?: StreamProviderInfo;
}

export interface TourStatusPayload {
  isLive?: boolean;
  live?: boolean;
  status?: 'live' | 'offline';
  viewerCount?: number;
  viewers?: number;
  tour?: Partial<LiveTourDetails>;
  title?: string;
  shortDescription?: string;
  description?: string;
  hostName?: string;
  startedAtLabel?: string;
  location?: string;
  streamImageUrl?: string;
  hostImageUrl?: string;
  streamProvider?: StreamProviderInfo;
}

const INITIAL_STATE: TourStatusState = {
  isLive: false,
  viewerCount: 0,
  tour: null,
};

function normalizePayload(payload: TourStatusPayload, current: TourStatusState): TourStatusState {
  const isLive = payload.isLive ?? payload.live ?? (payload.status ? payload.status === 'live' : current.isLive);
  const viewerCount = payload.viewerCount ?? payload.viewers ?? current.viewerCount;
  const tourPayload = payload.tour ?? {};
  const title = tourPayload.title ?? payload.title;
  const shortDescription = tourPayload.shortDescription ?? payload.shortDescription ?? payload.description;

  return {
    isLive,
    viewerCount,
    tour: isLive
      ? {
          title: title ?? current.tour?.title ?? 'Live tour',
          shortDescription: shortDescription ?? current.tour?.shortDescription ?? '',
          hostName: tourPayload.hostName ?? payload.hostName ?? current.tour?.hostName,
          startedAtLabel: tourPayload.startedAtLabel ?? payload.startedAtLabel ?? current.tour?.startedAtLabel,
          location: tourPayload.location ?? payload.location ?? current.tour?.location,
          streamImageUrl: tourPayload.streamImageUrl ?? payload.streamImageUrl ?? current.tour?.streamImageUrl,
          hostImageUrl: tourPayload.hostImageUrl ?? payload.hostImageUrl ?? current.tour?.hostImageUrl,
        }
      : null,
    streamProvider: payload.streamProvider ?? current.streamProvider,
  };
}

async function fetchTourStatus(apiBase: string): Promise<TourStatusPayload | null> {
  try {
    const response = await fetch(`${apiBase}/api/tour-status`);
    if (!response.ok) return null;
    const result = await response.json() as { data?: TourStatusPayload };
    return result.data ?? null;
  } catch {
    return null;
  }
}

export function useTourStatus() {
  const [state, setState] = useState<TourStatusState>(INITIAL_STATE);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>();

  // HTTP polling fallback (used when WebSocket fails or is unavailable)
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '';

    async function poll() {
      const data = await fetchTourStatus(apiBase);
      if (data) {
        setState((current) => normalizePayload(data, current));
      }
    }

    // Initial fetch
    void poll();

    // Poll every 5 seconds
    pollRef.current = setInterval(poll, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // WebSocket (replaces polling when connected)
  useEffect(() => {
    const configuredUrl = import.meta.env.VITE_TOUR_STATUS_WS_URL;
    let wsUrl: string;
    if (configuredUrl) {
      wsUrl = configuredUrl;
    } else {
      const apiBase = import.meta.env.VITE_API_URL || '';
      if (apiBase) {
        wsUrl = apiBase.replace(/^http/, 'ws') + '/api/live';
      } else {
        const fallbackProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${fallbackProtocol}//${window.location.host}/api/live`;
      }
    }
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let attempts = 0;
    let isDisposed = false;
    let wsConnected = false;

    const connect = () => {
      if (isDisposed) return;
      setConnectionState('connecting');
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        attempts = 0;
        wsConnected = true;
        setConnectionState('connected');
        // Stop HTTP polling — WebSocket is live
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
        }
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TourStatusPayload;
          setState((current) => normalizePayload(payload, current));
        } catch {
          setState((current) => current);
        }
      };

      socket.onclose = () => {
        if (isDisposed) return;
        setConnectionState('disconnected');
        if (wsConnected) {
          // WebSocket was connected then dropped — resume polling
          wsConnected = false;
          if (!pollRef.current) {
            const apiBase = import.meta.env.VITE_API_URL || '';
            const poll = async () => {
              const data = await fetchTourStatus(apiBase);
              if (data) setState((current) => normalizePayload(data, current));
            };
            void poll();
            pollRef.current = setInterval(poll, 5000);
          }
        }
        attempts += 1;
        const retryDelay = Math.min(30000, 1000 * 2 ** attempts);
        retryTimer = window.setTimeout(connect, retryDelay);
      };

      socket.onerror = () => {
        setState((current) => current);
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return useMemo(() => ({ ...state, connectionState }), [connectionState, state]);
}
