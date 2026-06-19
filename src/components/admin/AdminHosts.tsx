import { Ban, CheckCircle, Eye, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  adminDeleteHost,
  adminGetHosts,
  adminUpdateHost,
  type AdminHostRecord,
} from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminHosts() {
  const { passcode } = useAdminAuth();
  const [hosts, setHosts] = useState<AdminHostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingHost, setViewingHost] = useState<AdminHostRecord | null>(null);

  async function load() {
    if (!passcode) return;
    try {
      const res = await adminGetHosts(passcode);
      setHosts(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hosts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [passcode]);

  async function handleToggleStatus(host: AdminHostRecord) {
    if (!passcode || processingId) return;
    const newStatus = host.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'Suspend' : 'Activate';
    if (!confirm(`${action} host "${host.name}"?`)) return;
    setProcessingId(host.id);
    try {
      await adminUpdateHost(passcode, host.id, { status: newStatus });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action.toLowerCase()} host`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(host: AdminHostRecord) {
    if (!passcode || processingId) return;
    if (!confirm(`Delete host "${host.name}"? This cannot be undone.`)) return;
    setProcessingId(host.id);
    try {
      await adminDeleteHost(passcode, host.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete host');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dark">Hosts</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage approved hosts and their access.</p>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : hosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No hosts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hosts.map(host => (
            <div key={host.id} className="bg-white rounded-xl border border-border px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-dark truncate">{host.name}</p>
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                    host.status === 'active' && 'bg-green-100 text-green-700',
                    host.status === 'suspended' && 'bg-red-100 text-red-700',
                  )}>
                    {host.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{host.email}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(host.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setViewingHost(host)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="View details"
                >
                  <Eye className="size-4 text-dark" />
                </button>
                <button
                  onClick={() => void handleToggleStatus(host)}
                  disabled={processingId === host.id}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  title={host.status === 'active' ? 'Suspend' : 'Activate'}
                >
                  {host.status === 'active' ? (
                    <Ban className="size-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="size-4 text-green-600" />
                  )}
                </button>
                <button
                  onClick={() => void handleDelete(host)}
                  disabled={processingId === host.id}
                  className="p-2 rounded-lg hover:bg-coral/10 transition-colors disabled:opacity-50"
                  title="Delete host"
                >
                  <Trash2 className="size-4 text-coral" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingHost && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">Host Profile</h3>
              <button onClick={() => setViewingHost(null)}><X className="size-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                <p className="text-sm font-bold text-dark mt-0.5">{viewingHost.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                <p className="text-sm text-dark mt-0.5">{viewingHost.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
                <p className="text-sm text-dark mt-0.5">{viewingHost.phone}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Experience</label>
                <p className="text-sm text-dark mt-0.5">{viewingHost.experience}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bio</label>
                <p className="text-sm text-dark mt-0.5">{viewingHost.bio || '—'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                <span className={cn(
                  'inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5',
                  viewingHost.status === 'active' && 'bg-green-100 text-green-700',
                  viewingHost.status === 'suspended' && 'bg-red-100 text-red-700',
                )}>
                  {viewingHost.status}
                </span>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Joined</label>
                <p className="text-sm text-dark mt-0.5">{new Date(viewingHost.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={() => setViewingHost(null)} className="w-full border border-border rounded-xl py-2.5 text-sm font-bold text-dark hover:bg-muted transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
