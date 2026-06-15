import { useState, FormEvent } from 'react';
import { Mail, Check, Globe, Instagram, Facebook, Linkedin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
              { Icon: Instagram, href: SOCIAL_LINKS.instagram, color: 'hover:bg-pink-500' },
              { Icon: Facebook, href: SOCIAL_LINKS.facebook, color: 'hover:bg-blue-600' },
              { Icon: TikTokIcon, href: SOCIAL_LINKS.tiktok, color: 'hover:bg-dark' },
              { Icon: Linkedin, href: SOCIAL_LINKS.linkedin, color: 'hover:bg-blue-700' },
              { Icon: WhatsAppIcon, href: SOCIAL_LINKS.whatsapp, color: 'hover:bg-green-500' },
            ].map(({ Icon, href, color }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
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
