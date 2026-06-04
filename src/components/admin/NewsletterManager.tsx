import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNewsletterSubscribers, type NewsletterSubscriber } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

export default function NewsletterManager() {
  const { passcode } = useAdminAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!passcode) return;
    getNewsletterSubscribers(passcode)
      .then(res => setSubscribers(res.data))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [passcode]);

  function exportCsv() {
    const rows = [
      ['email', 'source', 'subscribed', 'createdAt'],
      ...subscribers.map(s => [s.email, s.source, String(s.subscribed), s.createdAt]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Newsletter</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subscribers.length} active subscribers</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 border border-border bg-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-white rounded-xl border border-border animate-pulse" />)}</div>
      ) : subscribers.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm font-bold text-dark">No subscribers yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {['Email', 'Source', 'Signed up'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subscribers.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-dark">{s.email}</td>
                  <td className="px-5 py-3 text-muted-foreground">{s.source}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
