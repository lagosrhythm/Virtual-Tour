import { BarChart2, BookOpen, Globe, LayoutDashboard, LogOut, Mail, Radio, Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useAdminAuth } from './AdminAuthContext';
import AdminLogin from './AdminLogin';

type AdminView = 'dashboard' | 'live' | 'providers' | 'recommended' | 'catalog' | 'requests' | 'newsletter' | 'host_stream';

interface AdminLayoutProps {
  children: ReactNode;
  currentView: AdminView;
  onNavigate: (view: AdminView) => void;
}

const NAV_ITEMS: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live', label: 'Live Control', icon: Radio },
  { id: 'providers', label: 'Stream Providers', icon: Globe },
  { id: 'recommended', label: 'Recommended Tours', icon: Star },
  { id: 'catalog', label: 'Catalog Tours', icon: BookOpen },
  { id: 'requests', label: 'Tour Requests', icon: Users },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
];

export default function AdminLayout({ children, currentView, onNavigate }: AdminLayoutProps) {
  const { user, logout, token } = useAdminAuth();

  if (!token || !user) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-border flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <div className="size-7 rounded-full bg-coral flex items-center justify-center text-white">
            <Globe className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-dark leading-none">Lagos Rhythm</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left',
                currentView === id
                  ? 'bg-coral/10 text-coral'
                  : 'text-dark hover:bg-muted',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-bold text-dark truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{user.role}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export type { AdminView };
