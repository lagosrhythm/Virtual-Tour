import { useState } from 'react';
import { Info, MapPin, PlayCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface HeroProps {
  onWatch: () => void;
}

export default function Hero({ onWatch }: HeroProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <section className="relative w-full h-[calc(100vh-70px)] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: "url('https://storage.googleapis.com/banani-generated-images/generated-images/eab842f3-072b-4d98-a899-55034e9f249b.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[1]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center p-6 md:p-12 max-w-4xl mx-auto space-y-8"
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] drop-shadow-2xl">
          Experience the Real Lagos
        </h1>

        <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed drop-shadow-md">
          Immersive live virtual tours that let you explore Lagos, its streets, stories, culture, and hidden gems, from anywhere in the world.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
          <button
            type="button"
            onClick={onWatch}
            className="w-full sm:w-auto bg-coral text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl shadow-coral/30 hover:bg-coral/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
          >
            <PlayCircle className="size-[26px] group-hover:scale-110 transition-transform" />
            <span>Join the Live Tour</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInfoOpen(true)}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl hover:bg-white/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Info className="size-[26px]" />
            <span>Learn More</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-10 pt-10 border-t border-white/20 text-white/80 text-sm font-semibold tracking-wide">
          <MapPin className="size-[20px] text-coral" />
          <span>Lagos, Nigeria • Free Experience</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {isInfoOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
              onClick={() => setIsInfoOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-dark transition-colors"
              >
                <X className="size-4" />
              </button>
              <div className="pr-10">
                <h2 className="text-xl font-bold text-dark">About Lagos Rhythm</h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Lagos Rhythm connects remote explorers to live guided experiences across Lagos, from neighborhood stories and cultural landmarks to markets, food, music, and hidden local routes.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
