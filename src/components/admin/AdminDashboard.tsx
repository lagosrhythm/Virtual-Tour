import { type ReactElement, useState } from 'react';
import { AdminAuthProvider } from './AdminAuthContext';
import AdminLayout, { type AdminView } from './AdminLayout';
import CatalogToursManager from './CatalogToursManager';
import DashboardOverview from './DashboardOverview';
import LiveControlPanel from './LiveControlPanel';
import NewsletterManager from './NewsletterManager';
import RecommendedToursManager from './RecommendedToursManager';
import StreamProviderManager from './StreamProviderManager';
import TourRequestsQueue from './TourRequestsQueue';
import HostGoLive from './HostGoLive';
import type { LiveTourRecord } from '../../lib/api';

export default function AdminDashboard() {
  const [view, setView] = useState<AdminView>('dashboard');
  const [activeStreamTour, setActiveStreamTour] = useState<LiveTourRecord | null>(null);

  const handleStartStream = (tour: LiveTourRecord) => {
    setActiveStreamTour(tour);
    setView('host_stream');
  };

  const views: Record<AdminView, ReactElement> = {
    dashboard: <DashboardOverview onNavigate={setView} />,
    live: <LiveControlPanel onStartStream={handleStartStream} />,
    providers: <StreamProviderManager />,
    recommended: <RecommendedToursManager />,
    catalog: <CatalogToursManager />,
    requests: <TourRequestsQueue />,
    newsletter: <NewsletterManager />,
    host_stream: activeStreamTour ? (
      <HostGoLive
        tourId={activeStreamTour.id}
        streamKey={activeStreamTour.metadata?.streamKey}
        ingestUrl={activeStreamTour.metadata?.ingestUrl}
        onEnd={() => setView('live')}
      />
    ) : <div />,
  };

  return (
    <AdminAuthProvider>
      <AdminLayout currentView={view} onNavigate={setView}>
        {views[view]}
      </AdminLayout>
    </AdminAuthProvider>
  );
}
