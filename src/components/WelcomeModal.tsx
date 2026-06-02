import { X, Mail, Globe2, Instagram, Twitter, Facebook, Youtube, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, FormEvent } from 'react';
import { subscribeToNewsletter } from '../lib/api';
import { cn } from '../lib/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setStatus('subscribing');
    setError(null);

    try {
      await subscribeToNewsletter({ email });
      setStatus('success');
      setTimeout(onClose, 2000);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Could not subscribe right now. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-cream text-gray-400 hover:bg-gray-100 hover:text-dark transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Branding Section */}
            <div className="bg-coral/5 p-8 flex flex-col items-center text-center border-b border-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-transparent pointer-events-none" />
              
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="size-20 rounded-full bg-coral flex items-center justify-center text-white mb-6 shadow-xl ring-8 ring-coral/10 z-10"
              >
                <Globe2 className="w-10 h-10" />
              </motion.div>

              <h2 className="font-display font-bold text-3xl text-dark mb-3 z-10">
                Welcome to Lagos Rhythm!
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-sm z-10">
                Discover the beauty, culture, and rhythm of Nigeria from anywhere in the world. Free virtual tours, live experiences, and more.
              </p>
            </div>

            {/* Subscription Flow */}
            <div className="p-8 space-y-8">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <label className="text-sm font-bold text-gray-700 block ml-1">
                  Get weekly tour recommendations
                </label>
                
                <div className="flex bg-cream rounded-2xl overflow-hidden border border-gray-100 focus-within:ring-4 focus-within:ring-coral/10 focus-within:border-coral focus-within:bg-white transition-all p-1.5 shadow-inner">
                  <div className="pl-4 flex items-center justify-center text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    className="flex-1 px-4 py-3 text-dark text-sm outline-none bg-transparent placeholder:text-gray-400"
                    disabled={status !== 'idle'}
                  />
                  <button
                    className={cn(
                      "font-bold px-8 py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2",
                      status === 'success' 
                        ? "bg-teal text-white" 
                        : "bg-coral text-white hover:bg-coral/90 shadow-coral/20"
                    )}
                    disabled={status !== 'idle'}
                  >
                    {status === 'idle' && "Join"}
                    {status === 'subscribing' && (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {status === 'success' && <Check className="w-5 h-5" />}
                  </button>
                </div>

                {error && (
                  <p className="rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm font-medium text-coral">
                    {error}
                  </p>
                )}
                
                <p className="text-xs text-center text-gray-400 font-medium">
                  Join 50,000+ explorers discovering new places weekly.
                </p>
              </form>

              {/* Social Links */}
              <div className="space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Or follow our journey
                  </span>
                </div>

                <div className="flex justify-center gap-4">
                  {[
                    { Icon: Instagram, color: 'hover:bg-pink-500' },
                    { Icon: Twitter, color: 'hover:bg-blue-400' },
                    { Icon: Facebook, color: 'hover:bg-blue-600' },
                    { Icon: Youtube, color: 'hover:bg-red-500' }
                  ].map(({ Icon, color }, i) => (
                    <motion.a
                      key={i}
                      whileHover={{ y: -5 }}
                      href="#"
                      className={cn(
                        "size-12 rounded-full bg-cream border border-gray-100 flex items-center justify-center text-dark transition-all shadow-sm hover:text-white",
                        color
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
