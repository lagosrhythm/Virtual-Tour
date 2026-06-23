import { useEffect } from 'react';

interface SEOEvent {
  name: string;
  startDate?: string;
  location?: string;
  description?: string;
  performer?: string;
  status?: 'scheduled' | 'cancelled' | 'postponed' | 'rescheduled';
}

interface SEOProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  event?: SEOEvent;
}

const DEFAULTS = {
  title: 'Lagos Rhythm — Live Virtual Tours Across Lagos, Nigeria',
  description:
    'Experience Lagos from anywhere. Join live virtual tours exploring Nigerian culture, street markets, food, music, and hidden gems. Free.',
  canonical: 'https://virtual-tour-5ac7.onrender.com',
  ogType: 'website' as const,
  ogImage: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200',
};

function setOrCreateMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      const [prefix, key] = name.split(':');
      el.setAttribute(prefix === 'og' ? 'property' : 'name', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOrCreateLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setOrCreateScript(id: string, innerText: string) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.seoId = id;
    document.head.appendChild(el);
  }
  el.textContent = innerText;
}

function removeScript(id: string) {
  const el = document.head.querySelector<HTMLScriptElement>(`script[data-seo-id="${id}"]`);
  if (el) el.remove();
}

function buildEventLD(event: SEOEvent): string {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
  };
  if (event.startDate) data.startDate = event.startDate;
  if (event.location) {
    data.location = { '@type': 'Place', name: event.location };
  }
  if (event.description) data.description = event.description;
  if (event.performer) data.performer = { '@type': 'Person', name: event.performer };
  if (event.status) {
    data.eventStatus = `https://schema.org/Event${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`;
  }
  return JSON.stringify(data);
}

export default function SEO({ title, description, canonicalPath, ogType, ogImage, event }: SEOProps) {
  useEffect(() => {
    const resolved = {
      title: title ?? DEFAULTS.title,
      description: description ?? DEFAULTS.description,
      canonical: canonicalPath
        ? `${DEFAULTS.canonical}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`
        : DEFAULTS.canonical,
      ogType: ogType ?? DEFAULTS.ogType,
      ogImage: ogImage ?? DEFAULTS.ogImage,
    };

    document.title = resolved.title;
    setOrCreateMeta('description', resolved.description);
    setOrCreateLink('canonical', resolved.canonical);
    setOrCreateMeta('og:title', resolved.title);
    setOrCreateMeta('og:description', resolved.description);
    setOrCreateMeta('og:url', resolved.canonical);
    setOrCreateMeta('og:type', resolved.ogType);
    setOrCreateMeta('og:image', resolved.ogImage);
    setOrCreateMeta('twitter:title', resolved.title);
    setOrCreateMeta('twitter:description', resolved.description);

    if (event) {
      setOrCreateScript('event-ld', buildEventLD(event));
    } else {
      removeScript('event-ld');
    }

    return () => {
      document.title = DEFAULTS.title;
      setOrCreateMeta('description', DEFAULTS.description);
      setOrCreateLink('canonical', DEFAULTS.canonical);
      setOrCreateMeta('og:title', DEFAULTS.title);
      setOrCreateMeta('og:description', DEFAULTS.description);
      setOrCreateMeta('og:url', DEFAULTS.canonical);
      setOrCreateMeta('og:type', DEFAULTS.ogType);
      setOrCreateMeta('og:image', DEFAULTS.ogImage);
      setOrCreateMeta('twitter:title', DEFAULTS.title);
      setOrCreateMeta('twitter:description', DEFAULTS.description);
      removeScript('event-ld');
    };
  }, [title, description, canonicalPath, ogType, ogImage, event]);

  return null;
}
