import { CheckCircle, Copy, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  adminApproveHostApplication,
  adminGetHostApplications,
  adminRejectHostApplication,
  type HostApplicationRecord,
} from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminApplications() {
  const { passcode } = useAdminAuth();
  const [applications, setApplications] = useState<HostApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [passcodeModal, setPasscodeModal] = useState<{ hostPasscode: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    if (!passcode) return;
    try {
      const res = await adminGetHostApplications(passcode);
      setApplications(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [passcode]);

  async function handleApprove(id: string) {
    if (!passcode || processingId) return;
    setProcessingId(id);
    try {
      const res = await adminApproveHostApplication(passcode, id);
      setPasscodeModal({ hostPasscode: res.data.passcode, name: applications.find(a => a.id === id)?.name || '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!passcode || processingId) return;
    if (!confirm('Reject this application?')) return;
    setProcessingId(id);
    try {
      await adminRejectHostApplication(passcode, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setProcessingId(null);
    }
  }

  function copyPasscode() {
    if (!passcodeModal) return;
    navigator.clipboard.writeText(passcodeModal.hostPasscode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sorted = [...applications].sort((a, b) => {
    const order = { pending: 0, approved: 1, rejected: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dark">Host Applications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Review and manage host applications.</p>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-border px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-dark truncate">{app.name}</p>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                      app.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                      app.status === 'approved' && 'bg-green-100 text-green-700',
                      app.status === 'rejected' && 'bg-red-100 text-red-700',
                    )}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{app.email} · {app.phone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">Experience: {app.experience}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => void handleApprove(app.id)}
                      disabled={processingId === app.id}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="size-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => void handleReject(app.id)}
                      disabled={processingId === app.id}
                      className="flex items-center gap-1.5 bg-white border border-border text-dark px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {passcodeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-dark">Host Approved</h3>
              <button onClick={() => setPasscodeModal(null)}><X className="size-5 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this passcode with <span className="font-bold text-dark">{passcodeModal.name}</span> so they can log in.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
              <code className="flex-1 font-mono text-sm font-bold text-dark select-all">{passcodeModal.hostPasscode}</code>
              <button onClick={copyPasscode} className="p-1.5 rounded-lg hover:bg-white transition-colors">
                {copied ? <CheckCircle className="size-4 text-green-600" /> : <Copy className="size-4 text-muted-foreground" />}
              </button>
            </div>
            <button onClick={() => setPasscodeModal(null)} className="w-full bg-coral text-white rounded-xl py-2.5 text-sm font-bold hover:bg-coral/90 transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
