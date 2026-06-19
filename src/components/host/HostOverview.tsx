import { Radio, User, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { hostGetMyTours } from '../../lib/api';
import { useHostAuth } from './HostAuthContext';
import type { HostView } from './HostLayout';

interface Props {
  onNavigate: (view: HostView) => void;
}

export default function HostOverview({ onNavigate }: Props) {
  const { passcode, host } = useHostAuth();
  const [stats, setStats] = useState({ totalTours: 0, liveTours: 0, totalViewers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!passcode || !host) return;
    hostGetMyTours(passcode)
      .then((res) => {
        const myTours = res.data;
        setStats({
          totalTours: myTours.length,
          liveTours: myTours.filter((t) => t.status === 'live').length,
          totalViewers: myTours.reduce((sum, t) => sum + (t.viewerCount || 0), 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [passcode, host]);

  const cards = [
    { label: 'Total Tours', value: stats.totalTours, icon: Radio, color: 'text-coral' },
    { label: 'Live Now', value: stats.liveTours, icon: Radio, color: 'text-teal' },
    { label: 'Total Viewers', value: stats.totalViewers, icon: Eye, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-dark">Welcome back, {host?.name || 'Host'}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Your host dashboard overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-border p-5"
          >
            <Icon className={`size-5 ${color} mb-3`} />
            {loading ? (
              <div className="h-7 w-12 bg-muted rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-dark">{value}</p>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('go_live')}
          className="bg-coral/5 border border-coral/20 rounded-2xl p-6 text-left hover:bg-coral/10 transition-colors"
        >
          <Radio className="size-6 text-coral mb-3" />
          <p className="font-bold text-dark">Go Live</p>
          <p className="text-sm text-muted-foreground mt-1">Start a new live tour broadcast.</p>
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className="bg-teal/5 border border-teal/20 rounded-2xl p-6 text-left hover:bg-teal/10 transition-colors"
        >
          <User className="size-6 text-teal mb-3" />
          <p className="font-bold text-dark">My Profile</p>
          <p className="text-sm text-muted-foreground mt-1">Edit your profile and bio.</p>
        </button>
      </div>
    </div>
  );
}
