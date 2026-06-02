import { Bell, Clock, Info, Maximize, Pause, Pin, Send, Settings, Share2, Users, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { CHAT } from '../constants';
import { useRecommendedTours } from '../hooks/useRecommendedTours';
import { cn } from '../lib/utils';
import { type LiveTourDetails } from '../types';

interface StreamProviderInfo {
  type: 'youtube' | 'mux' | 'cloudflare' | 'manual_hls' | 'browser_webrtc';
  name: string;
  config: Record<string, unknown>;
}

function getYouTubeEmbedUrl(config: Record<string, unknown>): string | null {
  const videoId = config.youtubeVideoId ?? config.videoId;
  if (typeof videoId === 'string' && videoId.trim()) {
    return `https://www.youtube.com/embed/${videoId.trim()}?autoplay=1&rel=0`;
  }
  const playbackUrl = config.playbackUrl;
  if (typeof playbackUrl === 'string' && playbackUrl.includes('youtube.com/watch')) {
    const id = new URL(playbackUrl).searchParams.get('v');
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  return null;
}

function HlsPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;

    // Native HLS (Safari) — no hls.js needed
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      void video.play();
      return;
    }

    // Dynamically import hls.js only when an HLS stream is actually needed
    void import('hls.js').then(({ default: Hls }) => {
      if (destroyed || !Hls.isSupported()) return;
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { void video.play(); });
      // Store cleanup on the video element to call on unmount
      (video as HTMLVideoElement & { _hls?: typeof hls })._hls = hls;
    });

    return () => {
      destroyed = true;
      const v = videoRef.current as (HTMLVideoElement & { _hls?: { destroy(): void } }) | null;
      v?._hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      controls
      playsInline
      aria-label={title}
    />
  );
}

function StreamPlayer({ provider, tour }: { provider: StreamProviderInfo | undefined; tour: LiveTourDetails | null }) {
  if (!provider || !tour) {
    // Offline slate
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,#2f2f2f_0,#111111_55%,#050505_100%)]">
        <div className="text-center px-6">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Users className="size-7 text-white/35" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/35">Stream offline</p>
        </div>
      </div>
    );
  }

  if (provider.type === 'youtube') {
    const embedUrl = getYouTubeEmbedUrl(provider.config);
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title={tour.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  }

  if (['manual_hls', 'mux', 'cloudflare'].includes(provider.type)) {
    const playbackUrl = provider.config.playbackUrl;
    if (typeof playbackUrl === 'string' && playbackUrl.trim()) {
      return <HlsPlayer src={playbackUrl.trim()} title={tour.title} />;
    }
  }

  if (provider.type === 'browser_webrtc') {
    const playbackUrl = provider.config.playbackUrl;
    if (typeof playbackUrl === 'string' && playbackUrl.trim()) {
      return <HlsPlayer src={playbackUrl.trim()} title={tour.title} />;
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,#1a1a2e_0,#111111_100%)]">
        <div className="text-center px-6">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Radio className="size-7 text-teal animate-pulse" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/50">Live WebRTC Stream</p>
          <p className="mt-2 text-[10px] text-white/30">Host is broadcasting from browser</p>
        </div>
      </div>
    );
  }

  // Fallback: static image or offline slate
  if (tour.streamImageUrl) {
    return <img src={tour.streamImageUrl} alt={tour.title} className="w-full h-full object-cover opacity-90" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,#2f2f2f_0,#111111_55%,#050505_100%)]">
      <div className="text-center px-6">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <Users className="size-7 text-white/35" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/35">Stream offline</p>
      </div>
    </div>
  );
}

interface LiveTourProps {
  status: {
    isLive: boolean;
    viewerCount: number;
    tour: LiveTourDetails | null;
    streamProvider?: StreamProviderInfo;
  };
}

function formatViewerCount(count: number) {
  return new Intl.NumberFormat('en', { notation: count >= 1000 ? 'compact' : 'standard' }).format(count);
}

export default function LiveTour({ status }: LiveTourProps) {
  const { isLive, tour, viewerCount } = status;
  const { tours, isLoading, error, retry } = useRecommendedTours();

  return (
    <div className="bg-white">
      <section id="live" className="px-4 md:px-8 py-4 md:py-8 max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="relative aspect-video bg-[#111111] rounded-2xl overflow-hidden shadow-2xl group ring-1 ring-white/10">
              <StreamPlayer provider={status.streamProvider} tour={isLive ? tour : null} />

              {isLive && tour && (
                <>
                  <div className="absolute top-3 left-3 md:top-4 md:left-4 flex gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-coral text-white text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg">
                      LIVE NOW
                    </span>
                    {tour.location && (
                      <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-[4px] text-white text-[10px] md:text-xs font-bold shadow-lg border border-white/10">
                        {tour.location}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 md:top-4 md:right-4 flex gap-2">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-[4px] text-white text-[10px] md:text-xs font-bold flex items-center gap-1.5 shadow-lg border border-white/10">
                      <Users className="size-3 md:size-4" />
                      {formatViewerCount(viewerCount)}
                    </span>
                    <button className="bg-black/40 backdrop-blur-md size-7 md:size-9 flex items-center justify-center rounded-full text-white hover:bg-black/60 transition-colors shadow-lg border border-white/10">
                      <Share2 className="size-3.5 md:size-4" />
                    </button>
                  </div>

                  {tour.hostImageUrl && (
                    <div className="absolute bottom-16 right-4 md:bottom-20 md:right-8 w-24 md:w-48 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                      <img src={tour.hostImageUrl} alt="Host" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 bg-coral text-white text-[8px] md:text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Host</div>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 pr-32 md:pr-64">
                    <h3 className="text-white font-bold text-sm md:text-2xl font-display drop-shadow-2xl leading-tight">
                      {tour.title}
                    </h3>
                  </div>

                  <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex items-center gap-3">
                    <div className="hidden sm:flex gap-2 p-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                      <Pause className="size-3.5 text-white cursor-pointer" />
                      <div className="w-12 md:w-20 h-1 bg-white/20 rounded-full mt-1.5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <Settings className="size-4 md:size-5 text-white opacity-80 hover:opacity-100 cursor-pointer drop-shadow-lg" />
                      <Maximize className="size-4 md:size-5 text-white opacity-80 hover:opacity-100 cursor-pointer drop-shadow-lg" />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4">
              {isLive && tour ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-coral/10 text-coral text-[10px] font-bold px-3 py-1.5 rounded-md uppercase flex items-center gap-2 tracking-widest leading-none border border-coral/20">
                        <span className="size-1.5 rounded-full bg-coral animate-pulse" />
                        Currently Live
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-dark font-display leading-tight">
                      {tour.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      {tour.hostName && (
                        <div className="flex items-center gap-2.5">
                          <div className="size-6 rounded-full bg-coral/10 flex items-center justify-center text-coral">
                            <Users className="size-3.5" />
                          </div>
                          <span>Hosted by: {tour.hostName}</span>
                        </div>
                      )}
                      {tour.startedAtLabel && (
                        <div className="flex items-center gap-2.5">
                          <div className="size-6 rounded-full bg-coral/10 flex items-center justify-center text-coral">
                            <Clock className="size-3.5" />
                          </div>
                          <span>{tour.startedAtLabel}</span>
                        </div>
                      )}
                    </div>
                    {tour.shortDescription && (
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-3xl pt-2">
                        {tour.shortDescription}
                      </p>
                    )}
                  </div>

                  <button className="bg-teal hover:bg-teal/90 text-white px-10 py-4 rounded-full font-bold text-sm shadow-xl shadow-teal/20 transition-all active:scale-95 whitespace-nowrap self-start">
                    Donate to Host
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <span className="inline-flex bg-muted text-muted-foreground text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-widest leading-none border border-border">
                    Offline
                  </span>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-dark font-display leading-tight">
                    No active live tour
                  </h1>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
                    The player will update automatically when a tour begins broadcasting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {isLive ? (
            <aside className="w-full lg:w-[400px] flex flex-col h-[500px] lg:h-[calc(100vh-160px)] min-h-[450px] bg-white border border-border rounded-2xl shadow-sm overflow-hidden sticky top-[140px]">
              <div className="p-4 border-b border-border flex items-center justify-between bg-white/80 backdrop-blur-md">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-dark uppercase tracking-widest">Story Pot</span>
                  <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase opacity-70">
                    <Users className="size-3 text-coral" />
                    {formatViewerCount(viewerCount)} watching
                  </span>
                </div>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <Info className="size-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gray-50/10">
                {CHAT.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col gap-1.5 rounded-xl transition-all',
                      msg.pinned ? 'bg-[#1A1A1A] text-white shadow-xl p-4 relative' : 'bg-white border border-border/60 shadow-sm p-3.5',
                    )}
                  >
                    {msg.pinned && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-coral text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter">
                        <Pin className="size-2.5" />
                        Pinned
                      </div>
                    )}
                    <div className="flex items-center justify-between pointer-events-none">
                      <span className={cn('font-bold text-[11px] tracking-wide', msg.pinned ? 'text-coral' : 'text-teal')}>
                        {msg.user}
                      </span>
                      <span className="text-[9px] opacity-40 font-medium">{msg.time}</span>
                    </div>
                    <p className={cn('text-xs leading-relaxed font-medium', msg.pinned ? 'text-gray-200' : 'text-dark/80')}>
                      {msg.msg}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-border">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Share your thoughts..."
                    className="w-full bg-muted border border-border pl-5 pr-14 py-4 rounded-full text-sm font-semibold focus:outline-none focus:border-teal/40 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
                  />
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2 size-9 bg-coral text-white rounded-full shadow-lg shadow-coral/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                    <Send className="size-4.5" />
                  </button>
                </div>
              </div>
            </aside>
          ) : (
            <aside className="w-full lg:w-[400px] h-[260px] lg:h-[calc(100vh-160px)] min-h-[260px] bg-white border border-border rounded-2xl shadow-sm overflow-hidden sticky top-[100px] flex items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Info className="size-5" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-dark">Chat unavailable</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Live chat opens automatically when a broadcast is active.
                </p>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="px-4 md:px-8 py-20 bg-muted/20 border-t border-border">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-dark tracking-tight font-display">Recommended tours</h2>
            <p className="text-muted-foreground mt-2 font-medium text-lg">Featured live journeys selected for your next visit.</p>
          </div>

          {error && (
            <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-coral/20 bg-coral/5 p-5 text-sm text-dark sm:flex-row sm:items-center sm:justify-between">
              <p>Using local recommendations because the endpoint did not respond: {error}</p>
              <button
                type="button"
                onClick={() => void retry()}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-coral px-5 font-bold text-coral transition-colors hover:bg-coral hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3].map((item) => (
                <div key={item} className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
                  <div className="aspect-[16/10] animate-pulse bg-muted" />
                  <div className="space-y-4 p-8">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : tours.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-sm">
              <h3 className="text-lg font-bold text-dark">No recommended tours yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Check back soon for featured live journeys.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {tours.map((tour) => (
              <motion.div
                key={tour.id}
                whileHover={{ y: -8 }}
                className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm group hover:shadow-2xl transition-all duration-500"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={tour.img} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {tour.tags.map((tag) => (
                      <span key={tag} className="bg-white/95 backdrop-blur-md text-[10px] font-bold px-3 py-1 rounded-md text-dark shadow-md uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-bold text-xl text-dark leading-tight group-hover:text-coral transition-colors line-clamp-1 font-display">
                      {tour.title}
                    </h3>
                    <div className="flex items-center gap-2.5 text-coral font-bold text-xs">
                      <Bell className="size-4" />
                      <span className="uppercase tracking-widest">{tour.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-border/50">
                        {tour.host[0]}
                      </div>
                      <span className="text-xs font-bold text-gray-500 tracking-wide uppercase">{tour.host}</span>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-muted hover:bg-coral/10 hover:text-coral text-dark text-xs font-bold transition-all active:scale-95 shadow-sm">
                      <Bell className="size-4" />
                      <span>Remind Me</span>
                    </button>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
