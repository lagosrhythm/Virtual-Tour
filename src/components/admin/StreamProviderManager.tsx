import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createStreamProvider,
  deleteStreamProvider,
  getStreamProviders,
  updateStreamProvider,
  type StreamProvider,
} from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

const PROVIDER_TYPES: StreamProvider['type'][] = ['youtube', 'manual_hls', 'mux', 'cloudflare', 'browser_webrtc'];

const CONFIG_HINTS: Record<StreamProvider['type'], string> = {
  youtube: '{ "youtubeVideoId": "dQw4w9WgXcQ" }',
  manual_hls: '{ "playbackUrl": "https://example.com/stream.m3u8" }',
  mux: '{ "playbackUrl": "https://stream.mux.com/xxx.m3u8", "streamKey": "...", "ingestUrl": "rtmps://..." }',
  cloudflare: '{ "playbackUrl": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8" }',
  browser_webrtc: '{ "roomUrl": "https://..." }',
};

interface FormState {
  type: StreamProvider['type'];
  name: string;
  configRaw: string;
}

const EMPTY_FORM: FormState = { type: 'youtube', name: '', configRaw: '{}' };

export default function StreamProviderManager() {
  const { passcode } = useAdminAuth();
  const [providers, setProviders] = useState<StreamProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    if (!passcode) return;
    try {
      const res = await getStreamProviders(passcode);
      setProviders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [passcode]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(p: StreamProvider) {
    setEditingId(p.id);
    setForm({ type: p.type, name: p.name, configRaw: JSON.stringify(p.config, null, 2) });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!passcode) return;
    setFormError('');
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(form.configRaw) as Record<string, unknown>;
    } catch {
      setFormError('Config must be valid JSON.');
      return;
    }
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateStreamProvider(passcode, editingId, { type: form.type, name: form.name.trim(), config });
      } else {
        await createStreamProvider(passcode, { type: form.type, name: form.name.trim(), config });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!passcode || !confirm('Delete this stream provider?')) return;
    try {
      await deleteStreamProvider(passcode, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Stream Providers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage YouTube, HLS, Mux, and Cloudflare stream configs.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors">
          <Plus className="size-4" /> Add Provider
        </button>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No stream providers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add a YouTube, HLS, or Mux provider to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-sm text-dark">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.type}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted transition-colors"><Pencil className="size-4 text-dark" /></button>
                <button onClick={() => void handleDelete(p.id)} className="p-2 rounded-lg hover:bg-coral/10 transition-colors"><Trash2 className="size-4 text-coral" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">{editingId ? 'Edit Provider' : 'New Provider'}</h3>
              <button onClick={() => setShowForm(false)}><X className="size-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as StreamProvider['type'], configRaw: CONFIG_HINTS[e.target.value as StreamProvider['type']] }))}
                  className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50"
                >
                  {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main YouTube Channel"
                  className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Config (JSON)</label>
                <textarea
                  value={form.configRaw}
                  onChange={e => setForm(f => ({ ...f, configRaw: e.target.value }))}
                  rows={5}
                  className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-teal/50 resize-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Hint: {CONFIG_HINTS[form.type]}</p>
              </div>
            </div>

            {formError && <p className="text-xs text-coral bg-coral/5 border border-coral/20 rounded-lg px-3 py-2">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-border rounded-xl py-2.5 text-sm font-bold text-dark hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => void handleSave()} disabled={saving} className="flex-1 bg-coral text-white rounded-xl py-2.5 text-sm font-bold hover:bg-coral/90 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
