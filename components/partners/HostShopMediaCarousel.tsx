'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import NarratedShopTour from '@/components/partners/NarratedShopTour';
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
  videoScript,
  compact = false,
}: {
  shopName: string;
  items: MediaItem[];
  videoUrl?: string;
  videoScript?: string;
  compact?: boolean;
}) {
  const media = useMemo(() => {
    const candidates = items.filter((item) => item.type !== 'video');
    const seen = new Set<string>();
    return candidates.filter((item) => {
      if (!item?.url) return false;
      const key = normalizedUrl(item.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);
  const [index, setIndex] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(() => new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string>();
  const [playing, setPlaying] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  useEffect(() => setVideoPlaying(false), [index]);
  useEffect(() => {
    if (!playing || videoPlaying || media.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % media.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [playing, videoPlaying, media, index]);

  const requestedUrl = media[Math.min(index, media.length - 1)]?.url;
  useEffect(() => {
    if (requestedUrl && loadedUrls.has(requestedUrl) && !failedUrls.has(requestedUrl))
      setLastLoadedUrl(requestedUrl);
  }, [requestedUrl, loadedUrls, failedUrls]);

  if (!media.length) return null;
  const safeIndex = Math.min(index, media.length - 1);
  const requested = media[safeIndex]!;
  // Keep a decoded shop photo on screen while the next photo downloads.
  const active =
    loadedUrls.has(requested.url) && !failedUrls.has(requested.url)
      ? requested
      : (media.find((item) => item.url === lastLoadedUrl && !failedUrls.has(item.url)) ??
        media.find((item) => !failedUrls.has(item.url)) ??
        requested);
  const displayIndex = media.indexOf(active);
  const previous = () => setIndex((current) => (current - 1 + media.length) % media.length);
  const next = () => setIndex((current) => (current + 1) % media.length);

  return (
    <div
      className={
        compact
          ? 'w-full min-w-0 overflow-hidden bg-white'
          : 'mx-auto w-full max-w-[480px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg sm:rounded-3xl'
      }
    >
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden bg-slate-950 ${compact ? 'aspect-[16/10] max-h-[160px]' : 'aspect-[16/10] max-h-[300px] sm:max-h-[320px]'} `}
      >
        {active.type === 'video' ? (
          <video
            key={active.url}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onEnded={() => setVideoPlaying(false)}
            onError={() => setVideoPlaying(false)}
            className="host-shop-media-enter mx-auto h-auto w-auto max-h-[240px] object-scale-down bg-black sm:max-h-[320px]"
            style={{ maxWidth: 'min(100%, 480px)' }}
            aria-label={active.alt || `${shopName} video`}
          />
        ) : (
          <>
            {media.map((item, itemIndex) => (
              <Image
                key={item.url}
                src={item.url}
                fill
                unoptimized={!item.url.startsWith('/')}
                sizes={
                  compact
                    ? '(max-width: 767px) 45vw, (max-width: 1279px) 30vw, 260px'
                    : '(max-width: 640px) 90vw, 480px'
                }
                alt={item.alt || `${shopName} promotional image`}
                aria-hidden={item.url !== active.url}
                className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
                style={{ opacity: item.url === active.url && !failedUrls.has(item.url) ? 1 : 0 }}
                loading={compact ? "lazy" : "eager"}
                decoding="async"
                fetchPriority={compact ? 'auto' : itemIndex === 0 ? 'high' : 'low'}
                onLoad={() => {
                  setLoadedUrls((current) => new Set(current).add(item.url));
                  if (item.url === requested.url || !lastLoadedUrl) setLastLoadedUrl(item.url);
                }}
                onError={() => setFailedUrls((current) => new Set(current).add(item.url))}
              />
            ))}
            {failedUrls.size === media.length ? (
              <p className="relative px-6 text-center text-sm text-white" role="status">
                The shop photos could not load. Please use the shop website link below to view its
                portfolio.
              </p>
            ) : null}
          </>
        )}
        {active.type === 'video' ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-black text-white">
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-4 w-4" /> Video
            </span>
          </div>
        ) : null}
      </div>
      {compact && media.length > 1 ? (
        <div className="grid grid-cols-3 border-t border-slate-200 text-xs font-bold">
          <button type="button" onClick={previous} aria-label="Previous image" className="min-h-11">
            ‹
          </button>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
            className="min-h-11"
          >
            {playing ? 'Pause' : 'Play'} · {displayIndex + 1}/{media.length}
          </button>
          <button type="button" onClick={next} aria-label="Next image" className="min-h-11">
            ›
          </button>
        </div>
      ) : media.length > 1 ? (
        <div className="flex w-full items-center justify-between gap-4 border-t border-slate-200 bg-white px-4 py-2">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous image"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-slate-600" aria-live="polite">
            {displayIndex + 1} of {media.length}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-900 ring-1 ring-slate-300 hover:bg-slate-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}
      {videoUrl ? (
        <div className="border-t border-slate-200 bg-slate-950 p-4">
          <p className="mb-3 text-sm font-bold text-white">Watch the {shopName} shop video</p>
          {videoScript ? (
            <NarratedShopTour
              src={videoUrl}
              script={videoScript}
              shopName={shopName}
              onPlaybackChange={setVideoPlaying}
            />
          ) : (
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
              className="mx-auto block h-auto max-h-[320px] w-auto max-w-full object-contain"
              aria-label={`${shopName} shop video`}
            />
          )}
        </div>
      ) : null}
      {!compact ? (
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
          {media.length > 1 ? (
            <button
              type="button"
              onClick={() => setPlaying((current) => !current)}
              className="min-h-11 font-bold text-slate-900"
              aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
            >
              {playing ? 'Pause slideshow' : 'Play slideshow'}
            </button>
          ) : null}
          <span>
            {media.length > 1
              ? `${displayIndex + 1} of ${media.length}`
              : active.alt?.startsWith('Representative')
                ? 'Representative training image'
                : 'Shop portfolio'}
          </span>
          {active.source ? (
            <a
              href={active.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-slate-900 hover:underline"
            >
              Media source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}
      <style jsx>{`
        .host-shop-media-enter {
          animation: host-shop-media-fade 650ms ease-out both;
          transform-origin: center;
        }
        @keyframes host-shop-media-fade {
          from {
            opacity: 0;
            transform: scale(1.025);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .host-shop-media-enter {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
