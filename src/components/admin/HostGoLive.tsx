import { Camera, Mic, MicOff, Radio, StopCircle, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { updateLiveTour } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

interface HostGoLiveProps {
  tourId: string;
  streamKey?: string;
  ingestUrl?: string;
  onEnd: () => void;
}

export default function HostGoLive({ tourId, streamKey, ingestUrl, onEnd }: HostGoLiveProps) {
  const { token } = useAdminAuth();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function setupMedia() {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true,
        });
        setStream(media);
        if (videoRef.current) {
          videoRef.current.srcObject = media;
        }
      } catch (err) {
        setError('Could not access camera/microphone. Please check permissions.');
        console.error('Media access error:', err);
      }
    }
    void setupMedia();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const toggleVideo = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
    }
  };

  const startStream = async () => {
    if (!stream || !token) return;
    setIsStreaming(true);
    try {
      await updateLiveTour(token, tourId, { status: 'live' });
      console.log(`Starting WebRTC stream for tour ${tourId} to ${ingestUrl} with key ${streamKey}`);
    } catch (err) {
      setError('Failed to update tour status to live.');
      setIsStreaming(false);
    }
  };

  const stopStream = async () => {
    if (!token) return;
    try {
      await updateLiveTour(token, tourId, { status: 'ended' });
      setIsStreaming(false);
      onEnd();
    } catch (err) {
      console.error('Failed to end tour:', err);
      // Still end locally
      setIsStreaming(false);
      onEnd();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black rounded-2xl overflow-hidden relative group">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${!videoEnabled ? 'hidden' : ''}`}
      />

      {!videoEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
          <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <VideoOff className="size-10" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest">Camera Disabled</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 text-center">
          <div className="max-w-xs">
            <p className="text-coral font-bold mb-2">Error</p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        {isStreaming ? (
          <div className="flex items-center gap-2 bg-coral text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl">
            <span className="size-2 rounded-full bg-white animate-pulse" />
            Live
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-md text-white/80 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
            Preview Mode
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleAudio}
          className={`size-12 rounded-xl flex items-center justify-center transition-colors ${audioEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-coral/20 text-coral'}`}
        >
          {audioEnabled ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`size-12 rounded-xl flex items-center justify-center transition-colors ${videoEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-coral/20 text-coral'}`}
        >
          {videoEnabled ? <Video className="size-5" /> : <VideoOff className="size-5" />}
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        {!isStreaming ? (
          <button
            onClick={startStream}
            disabled={!!error || !stream}
            className="flex items-center gap-2 bg-coral text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors disabled:opacity-50"
          >
            <Radio className="size-5" /> Start Broadcast
          </button>
        ) : (
          <button
            onClick={stopStream}
            className="flex items-center gap-2 bg-white text-dark px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
          >
            <StopCircle className="size-5 text-coral" /> End Stream
          </button>
        )}
      </div>

      {/* Ingest Info Overlay (for host) */}
      {!isStreaming && (ingestUrl || streamKey) && (
        <div className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-[10px] font-mono text-white/40 max-w-[200px] hidden md:block">
          <p className="uppercase font-bold mb-1 text-white/20">Ingest Details</p>
          <p className="truncate">URL: {ingestUrl || 'N/A'}</p>
          <p className="truncate">Key: {streamKey ? '••••••••' : 'N/A'}</p>
        </div>
      )}
    </div>
  );
}
