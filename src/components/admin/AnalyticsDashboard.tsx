import { Activity, BarChart2, Mail, Radio, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAnalyticsSummary, getOperationLogs, type AnalyticsSummary, type OperationLog } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

const ACTION_LABELS: Record<string, string> = {
  tour_go_live: 'Tour went live',
  tour_end: 'Tour ended',
  tour_update: 'Tour updated',
  stream_create: 'Stream provider created',
  stream_delete: 'Stream provider deleted',
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AnalyticsDashboard() {
  const { token } = useAdminAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([getAnalyticsSummary(token), getOperationLogs(token)])
      .then(([s, l]) => {
        setSummary(s.data);
        setLogs(l.data);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token]);

  const statCards = summary ? [
    { label: 'Total Tour Requests', value: summary.totalTourRequests, icon: Users, color: 'text-blue-500' },
    { label: 'Newsletter Subscribers', value: summary.totalSubscribers, icon: Mail, color: 'text-purple-500' },
    { label: 'Live Tours', value: summary.totalLiveTours, icon: Radio, color: 'text-coral' },
    { label: 'Total Viewers', value: summary.totalViewers.toLocaleString(), icon: Activity, color: 'text-teal' },
    { label: 'Avg. Viewers/Tour', value: summary.avgViewers, icon: BarChart2, color: 'text-orange-500' },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-dark">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Platform activity and operation history.</p>
      </div>

      {error && <p className="text-sm text-coral bg-coral/5 border border-coral/20 rounded-xl px-4 py-3">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading
          ? [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-border animate-pulse" />)
          : statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-5">
              <Icon className={`size-5 ${color} mb-3`} />
              <p className="text-2xl font-bold text-dark">{value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))
        }
      </div>

      {/* Recent logs */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Operations</h3>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-white rounded-xl border border-border animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <BarChart2 className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-bold text-dark">No operations logged yet</p>
            <p className="text-xs text-muted-foreground mt-1">Actions like going live and ending tours will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  {['Action', 'Resource', 'Status', 'When'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-dark">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs truncate max-w-[140px]">
                      {log.resourceId.slice(0, 12)}…
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${log.status === 'success' ? 'bg-teal/10 text-teal' : 'bg-coral/10 text-coral'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{timeAgo(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
