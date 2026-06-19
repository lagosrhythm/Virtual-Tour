import { useState } from 'react';
import { Globe, Menu, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onLogoClick: () => void;
  onLiveClick: () => void;
  onCatalogClick: () => void;
  onRequestTour: () => void;
  onBecomeHost: () => void;
  isLive: boolean;
  liveTourTitle?: string;
}

export default function Navbar({ onLogoClick, onLiveClick, onCatalogClick, onRequestTour, onBecomeHost, isLive, liveTourTitle }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full flex flex-col fixed top-0 z-50">
      {isLive && (
        <div className="bg-teal text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 relative z-10 shadow-sm leading-tight transition-transform duration-300">
          <span className="flex size-2 rounded-full bg-coral animate-pulse" />
          <span>{liveTourTitle || 'Live tour'} is live</span>
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
          <button onClick={onBecomeHost} className="hover:text-coral transition-colors">
            Become a Host
          </button>
          <a href="#catalog" onClick={onCatalogClick} className="hover:text-coral transition-colors">
            Catalog
          </a>
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-sm font-semibold">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="size-5 text-dark" />
          </button>
          <a
            href="/admin"
            className="hidden md:flex items-center gap-3 border border-border rounded-full px-3 py-1.5 bg-white hover:shadow-md transition-all active:scale-95 group"
          >
            <Menu className="size-[16px] text-dark" />
            <div className="size-8 bg-muted rounded-full overflow-hidden flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <User className="text-muted-foreground size-[14px]" />
            </div>
          </a>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold text-dark">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-5 text-dark" />
                </button>
              </div>
              <div className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => handleNavClick(onLiveClick)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
                >
                  Live tour
                </button>
                <button
                  onClick={() => handleNavClick(onRequestTour)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
                >
                  Request a tour
                </button>
                <button
                  onClick={() => handleNavClick(onCatalogClick)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
                >
                  Catalog
                </button>
                <button
                  onClick={() => handleNavClick(onBecomeHost)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
                >
                  Become a Host
                </button>
                <div className="pt-4 border-t border-border">
                  <a
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-dark hover:bg-muted transition-colors"
                  >
                    <User className="size-4" />
                    Admin
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
