import { useState } from 'react';
import { Globe, LayoutDashboard, LogOut, Menu, Radio, User, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useHostAuth } from './HostAuthContext';
import HostLogin from './HostLogin';

type HostView = 'dashboard' | 'go_live' | 'tours' | 'profile';

interface HostLayoutProps {
  children: ReactNode;
  currentView: HostView;
  onNavigate: (view: HostView) => void;
}

const NAV_ITEMS: { id: HostView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tours', label: 'My Tours', icon: Radio },
  { id: 'go_live', label: 'Go Live', icon: Radio },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function HostLayout({ children, currentView, onNavigate }: HostLayoutProps) {
  const { passcode, host, logout } = useHostAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!passcode) return <HostLogin />;

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-teal flex items-center justify-center text-white">
            <Globe className="size-4" />
          </div>
          <p className="font-bold text-sm text-dark">{host?.name || 'Host'}</p>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5 text-dark" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <div className={cn(
        "lg:hidden fixed inset-0 z-50 transition-opacity duration-300",
        isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div
          className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-teal flex items-center justify-center text-white">
                <Globe className="size-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-dark leading-none">{host?.name || 'Host'}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Host Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X className="size-4 text-dark" />
            </button>
          </div>
          <nav className="p-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { onNavigate(id); setIsSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left',
                  currentView === id
                    ? 'bg-teal/10 text-teal'
                    : 'text-dark hover:bg-muted',
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-border flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <div className="size-7 rounded-full bg-teal flex items-center justify-center text-white">
            <Globe className="size-4" />
          </div>
          <div>
            <p className="font-bold text-sm text-dark leading-none">{host?.name || 'Host'}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Host Portal</p>
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
                  ? 'bg-teal/10 text-teal'
                  : 'text-dark hover:bg-muted',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
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
      <main className="flex-1 lg:ml-60 p-4 pt-20 lg:p-8 lg:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export type { HostView };
