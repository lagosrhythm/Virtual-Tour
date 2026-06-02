import { Radio, Users, X, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createLiveTour,
  getLiveTours,
  getStreamProviders,
  updateLiveTour,
  type LiveTourRecord,
  type StreamProvider,
} from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

interface LiveControlPanelProps {
  onStartStream?: (tour: LiveTourRecord) => void;
}

export default function LiveControlPanel({ onStartStream }: LiveControlPanelProps) {
  const { token } = useAdminAuth();
  const [providers, setProviders] = useState<StreamProvider[]>([]);
  const [tours, setTours] = useState<LiveTourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    streamProviderId: '',
    title: '',
    shortDescription: '',
    hostName: '',
    location: '',
    youtubeVideoId: '',
    playbackUrl: '',
    streamKey: '',
    ingestUrl: '',
  });

  async function load() {
    if (!token) return;
    try {
      const [pRes, tRes] = await Promise.all([getStreamProviders(token), getLiveTours(token)]);
      setProviders(pRes.data);
      setTours(tRes.data);
      if (pRes.data.length > 0 && !form.streamProviderId) {
        setForm(f => ({ ...f, streamProviderId: pRes.data[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [token]);

  const activeTour = tours.find(t => t.status === 'live');
  const selectedProvider = providers.find(p => p.id === form.streamProviderId);

  async function handleCreate() {
    if (!token) return;
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.streamProviderId) { setFormError('Select a stream provider.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await createLiveTour(token, {
        streamProviderId: form.streamProviderId,
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        hostName: form.hostName.trim() || 'Lagos Rhythm',
        location: form.location.trim(),
        metadata: {
          youtubeVideoId: form.youtubeVideoId.trim() || undefined,
          playbackUrl: form.playbackUrl.trim() || undefined,
          streamKey: form.streamKey.trim() || undefined,
          ingestUrl: form.ingestUrl.trim() || undefined,
        },
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  async function handleGoLive(id: string) {
    if (!token) return;
    try {
      await updateLiveTour(token, id, { status: 'live' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go live');
    }
  }

  async function handleEndBroadcast(id: string) {
    if (!token || !confirm('End this broadcast?')) return;
    try {
      await updateLiveTour(token, id, { status: 'ended' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end broadcast');
    }
  }

  const statusColor: Record<LiveTourRecord['status'], string> = {
    live: 'bg-coral/10 text-coral',
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-teal/10 text-teal',
    ended: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Live Control Panel</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage live tour broadcasts.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); }}
          className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors"
        >
          <Radio className="size-4" /> New Tour
        </button>
      </div>

      {/* Active broadcast banner */}
      {activeTour && (
        <div className="bg-coral/5 border border-coral/20 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-2.5 rounded-full bg-coral animate-pulse" />
            <div>
              <p className="font-bold text-dark text-sm">{activeTour.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{activeTour.viewerCount} watching</span>
                {activeTour.hostName && <span>· {activeTour.hostName}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleEndBroadcast(activeTour.id)}
            className="bg-coral text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-coral/90 transition-colors"
          >
            End Broadcast
          </button>
        </div>
      )}

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {/* Tour history */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No tours yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first live tour above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-dark truncate">{t.title}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusColor[t.status]}`}>{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.hostName} · {t.location || 'Lagos, Nigeria'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {t.status === 'live' && providers.find(p => p.id === t.streamProviderId)?.type === 'browser_webrtc' && (
                  <button onClick={() => onStartStream?.(t)} className="bg-coral/10 text-coral px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-coral/20 transition-colors flex items-center gap-1.5">
                    <Video className="size-3" /> Stream
                  </button>
                )}
                {t.status === 'draft' && (
                  <button onClick={() => void handleGoLive(t.id)} className="bg-teal text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-teal/90 transition-colors">
                    Go Live
                  </button>
                )}
                {t.status === 'live' && (
                  <button onClick={() => void handleEndBroadcast(t.id)} className="bg-coral text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-coral/90 transition-colors">
                    End
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create tour modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">New Live Tour</h3>
              <button onClick={() => setShowForm(false)}><X className="size-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stream Provider</label>
                {providers.length === 0 ? (
                  <p className="text-xs text-coral mt-1">No providers found. Add one in Stream Providers first.</p>
                ) : (
                  <select
                    value={form.streamProviderId}
                    onChange={e => setForm(f => ({ ...f, streamProviderId: e.target.value }))}
                    className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50"
                  >
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                  </select>
                )}
              </div>

              {['title', 'shortDescription', 'hostName', 'location'].map(field => (
                <div key={field}>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {field === 'shortDescription' ? 'Description' : field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={field === 'hostName' ? 'Lagos Rhythm' : field === 'location' ? 'Lagos, Nigeria' : ''}
                    className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50"
                  />
                </div>
              ))}

              {selectedProvider?.type === 'youtube' && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">YouTube Video ID</label>
                  <input
                    value={form.youtubeVideoId}
                    onChange={e => setForm(f => ({ ...f, youtubeVideoId: e.target.value }))}
                    placeholder="dQw4w9WgXcQ"
                    className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal/50"
                  />
                </div>
              )}

              {['manual_hls', 'mux', 'cloudflare'].includes(selectedProvider?.type ?? '') && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Playback URL (.m3u8)</label>
                  <input
                    value={form.playbackUrl}
                    onChange={e => setForm(f => ({ ...f, playbackUrl: e.target.value }))}
                    placeholder="https://example.com/stream.m3u8"
                    className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal/50"
                  />
                </div>
              )}

              {selectedProvider?.type === 'browser_webrtc' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingest URL</label>
                    <input
                      value={form.ingestUrl}
                      onChange={e => setForm(f => ({ ...f, ingestUrl: e.target.value }))}
                      placeholder="wss://..."
                      className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stream Key</label>
                    <input
                      value={form.streamKey}
                      onChange={e => setForm(f => ({ ...f, streamKey: e.target.value }))}
                      placeholder="sk_..."
                      className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {formError && <p className="text-xs text-coral bg-coral/5 border border-coral/20 rounded-lg px-3 py-2">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold text-dark hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={saving || providers.length === 0} className="flex-1 bg-coral text-white rounded-xl py-2.5 text-sm font-bold hover:bg-coral/90 transition-colors disabled:opacity-60">
                {saving ? 'Creating…' : 'Create Tour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
