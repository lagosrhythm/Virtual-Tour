import { Mail, Radio, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLiveTours, getNewsletterSubscribers, getStreamProviders, getTourRequests } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';
import type { AdminView } from './AdminLayout';

interface Props {
  onNavigate: (view: AdminView) => void;
}

export default function DashboardOverview({ onNavigate }: Props) {
  const { passcode } = useAdminAuth();
  const [stats, setStats] = useState({ providers: 0, activeTours: 0, requests: 0, subscribers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!passcode) return;
    Promise.all([
      getStreamProviders(passcode),
      getLiveTours(passcode),
      getTourRequests(passcode),
      getNewsletterSubscribers(passcode),
    ])
      .then(([p, t, r, n]) => {
        setStats({
          providers: p.data.length,
          activeTours: t.data.filter(t => t.status === 'live').length,
          requests: r.data.filter(r => r.status === 'new').length,
          subscribers: n.data.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [passcode]);

  const cards = [
    { label: 'Stream Providers', value: stats.providers, icon: Radio, view: 'providers' as AdminView, color: 'text-coral' },
    { label: 'Live Now', value: stats.activeTours, icon: Radio, view: 'live' as AdminView, color: 'text-teal' },
    { label: 'New Requests', value: stats.requests, icon: Users, view: 'requests' as AdminView, color: 'text-blue-500' },
    { label: 'Subscribers', value: stats.subscribers, icon: Mail, view: 'newsletter' as AdminView, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-dark">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Lagos Rhythm admin overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, view, color }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className="bg-white rounded-2xl border border-border p-5 text-left hover:shadow-md transition-all group"
          >
            <Icon className={`size-5 ${color} mb-3`} />
            {loading ? (
              <div className="h-7 w-12 bg-muted rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-dark">{value}</p>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('live')}
          className="bg-coral/5 border border-coral/20 rounded-2xl p-6 text-left hover:bg-coral/10 transition-colors"
        >
          <Radio className="size-6 text-coral mb-3" />
          <p className="font-bold text-dark">Go Live</p>
          <p className="text-sm text-muted-foreground mt-1">Create a new live tour and start broadcasting.</p>
        </button>
        <button
          onClick={() => onNavigate('recommended')}
          className="bg-teal/5 border border-teal/20 rounded-2xl p-6 text-left hover:bg-teal/10 transition-colors"
        >
          <Star className="size-6 text-teal mb-3" />
          <p className="font-bold text-dark">Manage Tours</p>
          <p className="text-sm text-muted-foreground mt-1">Edit recommended tours shown to visitors.</p>
        </button>
      </div>
    </div>
  );
}
