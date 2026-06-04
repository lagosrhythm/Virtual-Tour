import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  adminCreateRecommendedTour,
  adminDeleteRecommendedTour,
  adminUpdateRecommendedTour,
  getRecommendedTours,
} from '../../lib/api';
import type { RecommendedTour } from '../../types';
import { useAdminAuth } from './AdminAuthContext';

interface FormState {
  title: string;
  host: string;
  time: string;
  tags: string;
  img: string;
  rank: string;
}

const EMPTY_FORM: FormState = { title: '', host: '', time: '', tags: '', img: '', rank: '1' };

export default function RecommendedToursManager() {
  const { passcode } = useAdminAuth();
  const [tours, setTours] = useState<RecommendedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    try {
      const res = await getRecommendedTours();
      setTours(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(t: RecommendedTour) {
    setEditingId(t.id);
    setForm({
      title: t.title,
      host: t.host,
      time: t.time,
      tags: t.tags.join(', '),
      img: t.img,
      rank: String(t.rank),
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
      const body = {
        title: form.title.trim(),
        host: form.host.trim(),
        time: form.time.trim(),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        img: form.img.trim(),
        rank: Number(form.rank) || 1,
      };
      if (editingId) {
        await adminUpdateRecommendedTour(passcode, editingId, body);
      } else {
        await adminCreateRecommendedTour(passcode, body);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number | string) {
    if (!passcode || !confirm('Delete this tour?')) return;
    try {
      await adminDeleteRecommendedTour(passcode, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Recommended Tours</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage featured tours shown on the homepage and live page.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-coral text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-coral/90 transition-colors">
          <Plus className="size-4" /> Add Tour
        </button>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No recommended tours</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...tours].sort((a, b) => a.rank - b.rank).map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center gap-4">
              <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{t.rank}</span>
              {t.img && <img src={t.img} alt={t.title} className="size-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-dark truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.host} · {t.time}</p>
              </div>
              <div className="flex gap-2 shrink-0">
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
              <h3 className="font-bold text-dark">{editingId ? 'Edit Tour' : 'New Recommended Tour'}</h3>
              <button onClick={() => setShowForm(false)}><X className="size-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-3">
              {([
                { key: 'title', label: 'Title', placeholder: 'Badagry Heritage Trail Live' },
                { key: 'host', label: 'Host', placeholder: 'Amina' },
                { key: 'time', label: 'Time', placeholder: 'Tomorrow, 2:00 PM (WAT)' },
                { key: 'tags', label: 'Tags (comma-separated)', placeholder: 'History, Culture' },
                { key: 'img', label: 'Image URL', placeholder: 'https://...' },
                { key: 'rank', label: 'Rank', placeholder: '1' },
              ] as const).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    type={key === 'rank' ? 'number' : 'text'}
                    className="w-full mt-1 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal/50"
                  />
                </div>
              ))}
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
