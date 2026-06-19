import { Plus, Radio, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  hostCreateTour,
  hostDeleteTour,
  hostGetMyTours,
  hostGetStreamProviders,
  hostUpdateTour,
  type LiveTourRecord,
  type StreamProvider,
} from '../../lib/api';
import { useHostAuth } from './HostAuthContext';

interface Props {
  onStartStream: (tour: LiveTourRecord) => void;
}

const STATUS_STYLES: Record<LiveTourRecord['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-50 text-blue-600',
  live: 'bg-coral/10 text-coral',
  ended: 'bg-gray-100 text-gray-400',
};

interface FormState {
  title: string;
  shortDescription: string;
  location: string;
  streamProviderId: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  shortDescription: '',
  location: '',
  streamProviderId: '',
};

export default function HostTours({ onStartStream }: Props) {
  const { passcode } = useHostAuth();
  const [tours, setTours] = useState<LiveTourRecord[]>([]);
  const [providers, setProviders] = useState<StreamProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    if (!passcode) return;
    try {
      const [toursRes, providersRes] = await Promise.all([
        hostGetMyTours(passcode),
        hostGetStreamProviders(passcode),
      ]);
      setTours(toursRes.data);
      setProviders(providersRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [passcode]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  async function handleCreate() {
    if (!passcode) return;
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    if (!form.streamProviderId) { setFormError('Select a stream provider.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await hostCreateTour(passcode, {
        title: form.title,
        shortDescription: form.shortDescription || undefined,
        location: form.location || undefined,
        streamProviderId: form.streamProviderId,
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create tour');
    } finally {
      setSaving(false);
    }
  }

  async function handleGoLive(tour: LiveTourRecord) {
    if (!passcode) return;
    try {
      await hostUpdateTour(passcode, tour.id, { status: 'live' });
      await load();
      onStartStream({ ...tour, status: 'live' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go live');
    }
  }

  async function handleEndTour(id: string) {
    if (!passcode) return;
    try {
      await hostUpdateTour(passcode, id, { status: 'ended' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end tour');
    }
  }

  async function handleDelete(id: string) {
    if (!passcode || !confirm('Delete this tour?')) return;
    try {
      await hostDeleteTour(passcode, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tour');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">My Tours</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{tours.length} total tours.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors">
          <Plus className="size-4" /> Create Tour
        </button>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No tours yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first tour to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-dark truncate">{t.title}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.location || 'No location'} {t.viewerCount > 0 ? `· ${t.viewerCount} viewers` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {t.status === 'draft' && (
                  <button
                    onClick={() => void handleGoLive(t)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-coral text-white hover:bg-coral/90 transition-colors"
                  >
                    <Radio className="size-3.5" /> Go Live
                  </button>
                )}
                {t.status === 'live' && (
                  <>
                    <button
                      onClick={() => onStartStream(t)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-teal text-white hover:bg-teal/90 transition-colors"
                    >
                      <Radio className="size-3.5" /> Stream
                    </button>
                    <button
                      onClick={() => void handleEndTour(t.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      End
                    </button>
                  </>
                )}
                {t.status === 'ended' && (
                  <button
                    onClick={() => void handleDelete(t.id)}
                    className="p-2 rounded-lg hover:bg-coral/10 transition-colors"
                  >
                    <Trash2 className="size-4 text-coral" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">Create Tour</h3>
              <button onClick={() => setShowForm(false)}><X className="size-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stream Provider</label>
                <select value={form.streamProviderId} onChange={e => setForm(f => ({ ...f, streamProviderId: e.target.value }))} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50">
                  <option value="">Select a provider…</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Lagos, Nigeria" className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} rows={3} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50 resize-none" />
              </div>
            </div>

            {formError && <p className="text-xs text-coral bg-coral/5 border border-coral/20 rounded-lg px-3 py-2">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold text-dark hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={saving} className="flex-1 bg-coral text-white rounded-xl py-2.5 text-sm font-bold hover:bg-coral/90 transition-colors disabled:opacity-60">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
