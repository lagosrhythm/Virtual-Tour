import { useState, FormEvent } from 'react';
import { Mail, Check, Globe, Instagram, Twitter, Facebook, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToNewsletter } from '../lib/api';
import { cn } from '../lib/utils';

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status !== 'idle') return;
    
    setStatus('subscribing');
    setError(null);

    try {
      await subscribeToNewsletter({ email });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Could not subscribe right now. Please try again.');
    }
  };

  return (
    <section className="newsletter-section px-4 md:px-8 py-12 max-w-[1440px] mx-auto">
      <div className="newsletter-panel bg-coral/5 border border-coral/20 rounded-[2.5rem] p-8 md:p-14 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-sm">
        {/* Background Globe Icon */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -translate-y-1/4 translate-x-1/4">
          <Globe className="size-[400px] text-coral" strokeWidth={1} />
        </div>

        <div className="flex-1 flex flex-col gap-5 relative z-10 text-center lg:text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-dark tracking-tight">
            Never miss a journey.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Join 50,000+ explorers getting weekly free tour recommendations, exclusive meetups, and deep dives into African culture.
          </p>
        </div>

        <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
          <form 
            onSubmit={handleSubmit}
            className="flex bg-white border border-border rounded-full p-2 shadow-xl focus-within:ring-4 focus-within:ring-coral/10 focus-within:border-coral transition-all"
          >
            <div className="flex-1 px-4 py-2 flex items-center text-muted-foreground">
              <Mail className="mr-3 size-[20px] text-coral/60" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full bg-transparent outline-none text-dark text-base font-medium placeholder:text-gray-300"
                disabled={status === 'success'}
              />
            </div>
            <button
              disabled={status !== 'idle'}
              className={cn(
                "font-bold px-8 py-3 rounded-full transition-all shadow-md whitespace-nowrap active:scale-95",
                status === 'success' 
                  ? "bg-teal text-white" 
                  : "bg-coral text-white hover:bg-coral/90 shadow-coral/20"
              )}
            >
              {status === 'idle' && "Subscribe"}
              {status === 'subscribing' && "..."}
              {status === 'success' && <Check className="size-5 mx-auto" />}
            </button>
          </form>

          {error && (
            <p className="rounded-xl border border-coral/20 bg-white px-4 py-3 text-sm font-medium text-coral shadow-sm">
              {error}
            </p>
          )}

          <div className="flex items-center justify-center lg:justify-start gap-4">
            <span className="text-sm font-bold text-muted-foreground mr-2 tracking-wide uppercase text-[10px]">Follow us:</span>
            {[
              { Icon: Instagram, color: 'hover:bg-pink-500' },
              { Icon: Twitter, color: 'hover:bg-blue-400' },
              { Icon: Facebook, color: 'hover:bg-blue-600' },
              { Icon: Youtube, color: 'hover:bg-red-500' }
            ].map(({ Icon, color }, i) => (
              <a
                key={i}
                href="#"
                className={cn(
                  "size-10 rounded-full bg-white border border-border flex items-center justify-center text-dark hover:text-white transition-all shadow-sm active:scale-90",
                  color
                )}
              >
                <Icon className="size-[16px]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
