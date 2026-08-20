'use client';

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from 'lucide-react';

type MediaItem = {
  url: string;
  alt?: string;
  source?: string;
  type?: 'image' | 'video';
};

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
    const normalized = items.filter((item) => Boolean(item?.url));
    if (videoUrl) normalized.unshift({ url: videoUrl, alt: `${shopName} video`, type: 'video' });
    return normalized;
  }, [items, shopName, videoUrl]);
  const [index, setIndex] = useState(0);

  if (!media.length) return null;
  const active = media[Math.min(index, media.length - 1)]!;
  const previous = () => setIndex((current) => (current - 1 + media.length) % media.length);
  const next = () => setIndex((current) => (current + 1) % media.length);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
      <div className="relative aspect-[4/3] bg-slate-900">
        {active.type === 'video' ? (
          <video src={active.url} controls playsInline preload="metadata" className="h-full w-full object-cover" aria-label={active.alt || `${shopName} video`} />
        ) : (
          <img src={active.url} alt={active.alt || `${shopName} promotional image`} className="h-full w-full object-cover" loading="lazy" />
        )}
        {media.length > 1 ? (
          <>
            <button type="button" onClick={previous} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2.5 text-white backdrop-blur hover:bg-black/85"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={next} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2.5 text-white backdrop-blur hover:bg-black/85"><ChevronRight className="h-5 w-5" /></button>
          </>
        ) : null}
        {active.type === 'video' ? <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-black text-white"><span className="inline-flex items-center gap-1.5"><PlayCircle className="h-4 w-4" /> Video</span></div> : null}
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-slate-200">
        <span>{media.length > 1 ? `${index + 1} of ${media.length}` : 'Host Shop media'}</span>
        {active.source ? <a href={active.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-white hover:underline">Media source <ExternalLink className="h-3.5 w-3.5" /></a> : null}
      </div>
    </div>
  );
}
