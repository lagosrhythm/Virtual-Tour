import { X, Mail, Globe2, Instagram, Facebook, Linkedin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, FormEvent } from 'react';
import { subscribeToNewsletter } from '../lib/api';
import { cn } from '../lib/utils';
import { SOCIAL_LINKS } from '../constants/social';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.17V12a4.83 4.83 0 01-3.77-1.5V6.69h3.77z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

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
                    { Icon: Instagram, href: SOCIAL_LINKS.instagram, color: 'hover:bg-pink-500' },
                    { Icon: Facebook, href: SOCIAL_LINKS.facebook, color: 'hover:bg-blue-600' },
                    { Icon: TikTokIcon, href: SOCIAL_LINKS.tiktok, color: 'hover:bg-dark' },
                    { Icon: Linkedin, href: SOCIAL_LINKS.linkedin, color: 'hover:bg-blue-700' },
                    { Icon: WhatsAppIcon, href: SOCIAL_LINKS.whatsapp, color: 'hover:bg-green-500' },
                  ].map(({ Icon, href, color }, i) => (
                    <motion.a
                      key={i}
                      whileHover={{ y: -5 }}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
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
