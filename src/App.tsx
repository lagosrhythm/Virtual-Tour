import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import RecommendationSection from './components/RecommendationSection';
import Newsletter from './components/Newsletter';
import LiveTour from './components/LiveTour';
import Catalog from './components/Catalog';
import Footer from './components/Footer';
import WelcomeModal from './components/WelcomeModal';
import RequestTourModal from './components/RequestTourModal';
import BecomeHostModal from './components/BecomeHostModal';
import AdminDashboard from './components/admin/AdminDashboard';
import HostDashboard from './components/host/HostDashboard';
import { useTourStatus } from './hooks/useTourStatus';
import { cn } from './lib/utils';

const isAdminRoute = window.location.pathname.startsWith('/admin');
const isHostRoute = window.location.pathname.startsWith('/host');

export default function App() {
  const [isRequestTourOpen, setIsRequestTourOpen] = useState(false);
  const [isBecomeHostOpen, setIsBecomeHostOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'live'>('home');
  const tourStatus = useTourStatus();

  useEffect(() => {
    if (isAdminRoute) return;
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsWelcomeModalOpen(true);
        sessionStorage.setItem('hasSeenWelcome', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

// Admin route — render admin dashboard without public chrome
  if (isAdminRoute) return <AdminDashboard />;

  // Host route — render host dashboard without public chrome
  if (isHostRoute) return <HostDashboard />;

  const navigateTo = (view: 'home' | 'live') => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCatalog = () => {
    setCurrentView('home');
    window.setTimeout(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  return (
    <div className="min-h-screen bg-white selection:bg-coral/20 selection:text-coral font-sans">
      <Navbar
        onLogoClick={() => navigateTo('home')}
        onLiveClick={() => navigateTo('live')}
        onCatalogClick={navigateToCatalog}
        onRequestTour={() => setIsRequestTourOpen(true)}
        onBecomeHost={() => setIsBecomeHostOpen(true)}
        isLive={tourStatus.isLive}
        liveTourTitle={tourStatus.tour?.title}
      />

      <div className={cn(tourStatus.isLive ? 'pt-[96px] md:pt-[101px]' : 'pt-[64px] md:pt-[69px]')}>
        <main>
          {currentView === 'home' ? (
            <>
              <Hero onWatch={() => navigateTo('live')} />
              <Newsletter />
              <RecommendationSection />
              <Catalog />
            </>
          ) : (
            <LiveTour status={tourStatus} />
          )}
        </main>
      </div>

      <Footer />

      <RequestTourModal
        isOpen={isRequestTourOpen}
        onClose={() => setIsRequestTourOpen(false)}
      />

      <BecomeHostModal
        isOpen={isBecomeHostOpen}
        onClose={() => setIsBecomeHostOpen(false)}
      />

      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
      />
    </div>
  );
}
