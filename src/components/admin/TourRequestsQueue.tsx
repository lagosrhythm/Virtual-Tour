import { useEffect, useState } from 'react';
import { getTourRequests, updateTourRequestStatus, type TourRequest } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

const STATUSES: TourRequest['status'][] = ['new', 'reviewed', 'planned', 'rejected'];

const STATUS_STYLES: Record<TourRequest['status'], string> = {
  new: 'bg-coral/10 text-coral',
  reviewed: 'bg-teal/10 text-teal',
  planned: 'bg-blue-50 text-blue-600',
  rejected: 'bg-gray-100 text-gray-400',
};

export default function TourRequestsQueue() {
  const { passcode } = useAdminAuth();
  const [requests, setRequests] = useState<TourRequest[]>([]);
  const [filter, setFilter] = useState<TourRequest['status'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!passcode) return;
    try {
      const res = await getTourRequests(passcode);
      setRequests(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [passcode]);

  async function handleStatus(id: string, status: TourRequest['status']) {
    if (!passcode) return;
    try {
      await updateTourRequestStatus(passcode, id, status);
      setRequests(r => r.map(req => req.id === id ? { ...req, status } : req));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dark">Tour Requests</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{requests.length} total requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === s ? 'bg-dark text-white' : 'bg-white border border-border text-dark hover:bg-muted'
            }`}
          >
            {s} {s === 'all' ? `(${requests.length})` : `(${requests.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-bold text-sm text-dark truncate">{req.destination}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{req.email} · {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${STATUS_STYLES[req.status]}`}>{req.status}</span>
                <select
                  value={req.status}
                  onChange={e => void handleStatus(req.id, e.target.value as TourRequest['status'])}
                  className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-teal/50"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
