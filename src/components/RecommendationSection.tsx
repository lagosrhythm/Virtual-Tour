import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TourCard from './TourCard';
import { useCatalogTours } from '../hooks/useCatalogTours';

export default function RecommendationSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tours } = useCatalogTours();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="px-4 md:px-8 py-12 overflow-hidden max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-dark">Recommended Tours</h2>
          <p className="text-sm md:text-base text-muted-foreground">Explore our growing library of immersive virtual experiences anytime, anywhere.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-muted text-dark transition-colors active:scale-90"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-muted text-dark transition-colors active:scale-90"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 md:mx-0 md:px-0 snap-x"
      >
        {tours.map(tour => (
          <TourCard key={String(tour.id)} tour={tour} variant="compact" />
        ))}
      </div>
    </section>
  );
}
