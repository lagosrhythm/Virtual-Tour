import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  adminCreateCatalogTour,
  adminDeleteCatalogTour,
  adminGetCatalogTours,
  adminUpdateCatalogTour,
  type CatalogTourApi,
} from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

const CATEGORIES = ['Culture', 'Nature', 'History', 'Entertainment', 'Relaxation', 'Modern'];
const VISIBILITIES: CatalogTourApi['visibility'][] = ['public', 'draft', 'archived'];

const VISIBILITY_STYLES: Record<CatalogTourApi['visibility'], string> = {
  public: 'bg-teal/10 text-teal',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-gray-100 text-gray-400',
};

type FormState = Omit<CatalogTourApi, 'id'>;

const EMPTY_FORM: FormState = {
  title: '', category: 'Culture', duration: '', description: '',
  imageUrl: '', free: true, views: '', trend: '', visibility: 'public',
};

export default function CatalogToursManager() {
  const { passcode } = useAdminAuth();
  const [tours, setTours] = useState<CatalogTourApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterVis, setFilterVis] = useState<CatalogTourApi['visibility'] | 'all'>('all');

  async function load() {
    if (!passcode) return;
    try {
      const res = await adminGetCatalogTours(passcode);
      setTours(res.data);
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

  function openEdit(t: CatalogTourApi) {
    setEditingId(t.id);
    setForm({
      title: t.title, category: t.category, duration: t.duration,
      description: t.description, imageUrl: t.imageUrl, free: t.free,
      views: t.views ?? '', trend: t.trend ?? '', visibility: t.visibility,
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!passcode) return;
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await adminUpdateCatalogTour(passcode, editingId, form);
      } else {
        await adminCreateCatalogTour(passcode, form);
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
    if (!passcode || !confirm('Delete this tour?')) return;
    try {
      await adminDeleteCatalogTour(passcode, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function toggleVisibility(t: CatalogTourApi) {
    if (!passcode) return;
    const next: CatalogTourApi['visibility'] = t.visibility === 'public' ? 'draft' : 'public';
    try {
      await adminUpdateCatalogTour(passcode, t.id, { visibility: next });
      setTours(prev => prev.map(x => x.id === t.id ? { ...x, visibility: next } : x));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const filtered = filterVis === 'all' ? tours : tours.filter(t => t.visibility === filterVis);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Catalog Tours</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{tours.length} total · manage visibility, edit details, add new.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors">
          <Plus className="size-4" /> Add Tour
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', ...VISIBILITIES] as const).map(v => (
          <button
            key={v}
            onClick={() => setFilterVis(v)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${filterVis === v ? 'bg-dark text-white' : 'bg-white border border-border text-dark hover:bg-muted'}`}
          >
            {v} ({v === 'all' ? tours.length : tours.filter(t => t.visibility === v).length})
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No tours found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center gap-4">
              {t.imageUrl && <img src={t.imageUrl} alt={t.title} className="size-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-dark truncate">{t.title}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${VISIBILITY_STYLES[t.visibility]}`}>{t.visibility}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.category} · {t.duration}{t.free ? ' · Free' : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => void toggleVisibility(t)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {t.visibility === 'public' ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-muted transition-colors"><Pencil className="size-4 text-dark" /></button>
                <button onClick={() => void handleDelete(t.id)} className="p-2 rounded-lg hover:bg-coral/10 transition-colors"><Trash2 className="size-4 text-coral" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">{editingId ? 'Edit Tour' : 'New Catalog Tour'}</h3>
              <button onClick={() => setShowForm(false)}><X className="size-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="45m" className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Views</label>
                  <input value={form.views ?? ''} onChange={e => setForm(f => ({ ...f, views: e.target.value }))} placeholder="124k" className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trend</label>
                  <input value={form.trend ?? ''} onChange={e => setForm(f => ({ ...f, trend: e.target.value }))} placeholder="+3.2k this week" className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visibility</label>
                  <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value as CatalogTourApi['visibility'] }))} className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50">
                    {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.free} onChange={e => setForm(f => ({ ...f, free: e.target.checked }))} className="size-4 accent-coral" />
                    <span className="text-sm font-semibold text-dark">Free tour</span>
                  </label>
                </div>
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
