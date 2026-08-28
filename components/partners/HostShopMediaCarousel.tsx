'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from 'lucide-react';

type MediaItem = {
  url: string;
  alt?: string;
  source?: string;
  type?: 'image' | 'video';
};

function normalizedUrl(value: string) {
  try {
    const url = new URL(value, 'https://www.elevateforhumanity.org');
    url.hash = '';
    return url.toString();
  } catch {
    return value.trim();
  }
}

export default function HostShopMediaCarousel({
  shopName,
  items,
  videoUrl,
}: {
  shopName: string;
  items: MediaItem[];
  videoUrl?: string;
}) {
  const media = useMemo(() => {
    const candidates: MediaItem[] = [
      ...(videoUrl ? [{ url: videoUrl, alt: `${shopName} video`, type: 'video' as const }] : []),
      ...items,
    ];
    const seen = new Set<string>();
    return candidates.filter((item) => {
      if (!item?.url) return false;
      const key = normalizedUrl(item.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items, shopName, videoUrl]);
  const [index, setIndex] = useState(0);

  if (!media.length) return null;
  const safeIndex = Math.min(index, media.length - 1);
  const active = media[safeIndex]!;
  const previous = () => setIndex((current) => (current - 1 + media.length) % media.length);
  const next = () => setIndex((current) => (current + 1) % media.length);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:rounded-3xl">
      <div className="relative aspect-[4/3] w-full bg-white sm:aspect-[16/10] lg:max-h-[560px]">
        {active.type === 'video' ? (
          <video src={active.url} controls playsInline preload="metadata" className="h-full w-full object-contain bg-black" aria-label={active.alt || `${shopName} video`} />
        ) : (
          <img src={active.url} alt={active.alt || `${shopName} promotional image`} className="h-full w-full object-contain" loading="lazy" decoding="async" />
        )}
        {media.length > 1 ? (
          <>
            <button type="button" onClick={previous} aria-label="Previous image" className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md ring-1 ring-black/10 backdrop-blur hover:bg-white sm:left-3"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={next} aria-label="Next image" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-md ring-1 ring-black/10 backdrop-blur hover:bg-white sm:right-3"><ChevronRight className="h-5 w-5" /></button>
          </>
        ) : null}
        {active.type === 'video' ? <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-black text-white"><span className="inline-flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> Video</span></div> : null}
      </div>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
        <span>{media.length > 1 ? `${safeIndex + 1} of ${media.length}` : 'Verified business media'}</span>
        {active.source ? <a href={active.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-slate-900 hover:underline">Media source <ExternalLink className="h-3.5 w-3.5" /></a> : null}
      </div>
    </div>
  );
}
