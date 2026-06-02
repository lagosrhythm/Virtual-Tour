import React from 'react';
import { Clock, Eye, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import type { CatalogTourApi } from '../types';

interface TourCardProps {
  tour: CatalogTourApi;
  variant?: 'compact' | 'standard';
}

const CATEGORY_STYLES: Record<string, string> = {
  Culture: 'bg-white text-dark shadow-sm border border-border/50',
  Nature: 'bg-white text-dark shadow-sm border border-border/50',
  Entertainment: 'bg-white text-dark shadow-sm border border-border/50',
  History: 'bg-white text-dark shadow-sm border border-border/50',
  Relaxation: 'bg-white text-dark shadow-sm border border-border/50',
  Modern: 'bg-white text-dark shadow-sm border border-border/50',
};

const TourCard: React.FC<TourCardProps> = ({ tour, variant = 'standard' }) => {
  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      'group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex-shrink-0 border border-border/40 hover:-translate-y-1 snap-start',
      isCompact ? 'w-64 md:w-80' : 'w-full',
    )}>
      <div className="relative overflow-hidden aspect-video bg-muted">
        {tour.imageUrl ? (
          <img
            src={tour.imageUrl}
            alt={tour.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-border" />
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />

        <span className={cn(
          'absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md',
          CATEGORY_STYLES[tour.category] ?? 'bg-white text-dark shadow-sm border border-border/50',
        )}>
          {tour.category}
        </span>

        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md font-semibold flex items-center gap-1.5 shadow-lg">
          <Clock className="size-3" />
          {tour.duration}
        </div>
      </div>

      <div className="p-4 md:p-5 flex flex-col gap-2">
        <h3 className="font-bold text-base md:text-lg text-dark group-hover:text-coral transition-colors line-clamp-1">
          {tour.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground font-medium">
          {tour.views && (
            <div className="flex items-center gap-1.5">
              <Eye className="size-4" />
              <span>{tour.views} views</span>
            </div>
          )}

          {tour.trend && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              <TrendingUp className="size-3" />
              <span>{tour.trend}</span>
            </div>
          )}

          {tour.free && !tour.trend && (
            <div className="flex items-center gap-1.5 text-coral font-bold bg-coral/5 px-2 py-0.5 rounded-full text-[10px]">
              <span>Free</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCard;
