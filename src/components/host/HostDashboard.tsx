import { type ReactElement, useState } from 'react';
import { HostAuthProvider, useHostAuth } from './HostAuthContext';
import HostLayout, { type HostView } from './HostLayout';
import HostOverview from './HostOverview';
import HostProfile from './HostProfile';
import HostTours from './HostTours';
import HostGoLive from '../admin/HostGoLive';
import type { LiveTourRecord } from '../../lib/api';

function HostDashboardInner() {
  const { passcode } = useHostAuth();
  const [view, setView] = useState<HostView>('dashboard');
  const [activeStreamTour, setActiveStreamTour] = useState<LiveTourRecord | null>(null);

  const handleStartStream = (tour: LiveTourRecord) => {
    setActiveStreamTour(tour);
    setView('go_live');
  };

  const views: Record<HostView, ReactElement> = {
    dashboard: <HostOverview onNavigate={setView} />,
    tours: <HostTours onStartStream={handleStartStream} />,
    go_live: activeStreamTour ? (
      <HostGoLive
        tourId={activeStreamTour.id}
        streamKey={activeStreamTour.metadata?.streamKey}
        ingestUrl={activeStreamTour.metadata?.ingestUrl}
        onEnd={() => setView('dashboard')}
        passcode={passcode || undefined}
      />
    ) : (
      <HostOverview onNavigate={setView} />
    ),
    profile: <HostProfile />,
  };

  return (
    <HostLayout currentView={view} onNavigate={setView}>
      {views[view]}
    </HostLayout>
  );
}

export default function HostDashboard() {
  return (
    <HostAuthProvider>
      <HostDashboardInner />
    </HostAuthProvider>
  );
}
