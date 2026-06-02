import { FormEvent, useEffect, useState } from 'react';
import { Check, Mail, MapPin, Send, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { submitTourRequest } from '../lib/api';
import { cn } from '../lib/utils';

interface RequestTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestTourModal({ isOpen, onClose }: RequestTourModalProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [destination, setDestination] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setDestination('');
      setEmail('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (status !== 'idle') return;

    setStatus('sending');
    setError(null);

    try {
      await submitTourRequest({ destination, email });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-dark transition-colors"
            >
              <X className="size-5" />
            </button>

            <div className="pr-10">
              <h2 className="text-2xl font-bold tracking-tight text-dark">Request a tour</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Tell us what part of Lagos you want to explore and we will use it to shape upcoming recommended tours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Destination or theme</span>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-coral/70" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="Food markets, art spaces, nightlife..."
                    autoComplete="off"
                    className="w-full rounded-2xl border border-border bg-muted py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10 focus-visible:ring-4 focus-visible:ring-coral/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-coral/70" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-border bg-muted py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-coral focus:bg-white focus:ring-4 focus:ring-coral/10 focus-visible:ring-4 focus-visible:ring-coral/10"
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm font-medium text-coral">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status !== 'idle'}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all active:scale-95',
                  status === 'success' ? 'bg-teal' : 'bg-coral hover:bg-coral/90 shadow-lg shadow-coral/20',
                )}
              >
                {status === 'idle' && (
                  <>
                    <Send className="size-4" />
                    Send request
                  </>
                )}
                {status === 'sending' && 'Sending...'}
                {status === 'success' && (
                  <>
                    <Check className="size-4" />
                    Request received
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
