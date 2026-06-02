import { Globe, Menu, User } from 'lucide-react';

interface NavbarProps {
  onLogoClick: () => void;
  onLiveClick: () => void;
  onCatalogClick: () => void;
  onRequestTour: () => void;
  isLive: boolean;
}

export default function Navbar({ onLogoClick, onLiveClick, onCatalogClick, onRequestTour, isLive }: NavbarProps) {
  return (
    <header className="w-full flex flex-col fixed top-0 z-50">
      {isLive && (
        <div className="bg-teal text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 relative z-10 shadow-sm leading-tight transition-transform duration-300">
          <span className="flex size-2 rounded-full bg-coral animate-pulse" />
          <span>Born from this ground is live</span>
        </div>
      )}

      <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 border-b border-border bg-white shadow-sm transition-all duration-300">
        <div
          onClick={onLogoClick}
          className="flex items-center gap-2 cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          <div className="size-8 rounded-full bg-coral flex items-center justify-center text-white shadow-lg shadow-coral/20 group-hover:shadow-coral/40 transition-all">
            <Globe className="size-[18px]" />
          </div>
          <span className="font-bold text-lg md:text-xl text-dark tracking-tight">
            Lagos Rhythm
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-dark">
          <button onClick={onLiveClick} className="hover:text-coral transition-colors">
            Live tour
          </button>
          <button onClick={onRequestTour} className="hover:text-coral transition-colors">
            Request a tour
          </button>
          <a href="#catalog" onClick={onCatalogClick} className="hover:text-coral transition-colors">
            Catalog
          </a>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <a
            href="/admin"
            className="flex items-center gap-3 border border-border rounded-full px-3 py-1.5 bg-white hover:shadow-md transition-all active:scale-95 group"
          >
            <Menu className="size-[16px] text-dark" />
            <div className="size-8 bg-muted rounded-full overflow-hidden flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <User className="text-muted-foreground size-[14px]" />
            </div>
          </a>
        </div>
      </nav>
    </header>
  );
}
