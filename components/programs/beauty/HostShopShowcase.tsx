'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FeaturedHostPartner } from '@/lib/apprenticeship-programs/host-partners';

const ROTATION_MS = 8000;

export default function HostShopShowcase({ shops }: { shops: FeaturedHostPartner[] }) {
  // Shops without verified media remain in the directory below, but do not
  // become empty decorative slides in the rotating gallery.
  const slides = useMemo(() => shops.flatMap((shop) =>
    (shop.media ?? []).map((media) => ({ shop, media }))
  ), [shops]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || interacting || reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [interacting, paused, reduceMotion, slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    const nextSlides = [1, 2].map((offset) => slides[(activeIndex + offset) % slides.length]);
    nextSlides.forEach((slide) => {
      if (!slide?.media?.src) return;
      const preload = new window.Image();
      preload.src = slide.media.src;
    });
  }, [activeIndex, slides]);

  if (!slides.length) return null;

  const { shop, media: image } = slides[activeIndex];
  const externalUrl = shop.websiteUrl ?? shop.onlineListingUrl ?? shop.socialUrl;
  const externalLabel = shop.websiteLabel ?? shop.onlineListingLabel ?? shop.socialLabel ?? 'Visit shop online';

  function go(delta: number) {
    setActiveIndex((current) => (current + delta + slides.length) % slides.length);
  }

  return (
    <section
      aria-labelledby="host-shop-showcase-heading"
      className="border-y border-sky-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12 text-slate-950 sm:px-6 sm:py-16"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setInteracting(false);
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-red-700">Meet the host-shop network</p>
            <h2 id="host-shop-showcase-heading" className="mt-2 max-w-4xl text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Train in real shops. Discover the businesses behind the apprenticeship.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
              This rotating showcase introduces approved host shops, where they are located, and how to visit, book, or learn more.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border-2 border-brand-blue-700 bg-white px-4 py-2 text-sm font-black text-brand-blue-900 hover:bg-sky-50 sm:self-auto"
            aria-label={paused ? 'Resume host shop slideshow' : 'Pause host shop slideshow'}
            aria-pressed={paused}
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? 'Play' : 'Pause'}
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative aspect-[4/3] min-h-0 overflow-hidden bg-slate-100 sm:aspect-[16/10] lg:aspect-auto lg:min-h-[390px]">
              {image?.kind === 'video' ? (
                <video
                  key={image.src}
                  src={image.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-black object-contain"
                  aria-label={image.alt}
                />
              ) : image && !failedImages.has(image.src) ? (
                <Image
                  key={image.src}
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={activeIndex === 0}
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-contain bg-white"
                  onError={() => setFailedImages((current) => {
                    const next = new Set(current);
                    next.add(image.src);
                    return next;
                  })}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.32),transparent_42%),linear-gradient(145deg,#1e293b,#020617)] px-8 py-10 sm:px-12 sm:py-12">
                  <p className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl">{shop.dba ?? shop.name}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-300">Local business • {shop.city}, {shop.state}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center p-7 text-slate-950 sm:p-9 lg:p-10" aria-live="polite">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                Host Shop gallery image {activeIndex + 1} of {slides.length}
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{shop.dba ?? shop.name}</h3>
              {shop.dba ? <p className="mt-1 text-sm text-slate-600">Legal name: {shop.name}</p> : null}
              <p className="mt-5 text-base leading-7 text-slate-700">{shop.marketingBlurb ?? shop.note}</p>
              <p className="mt-5 flex items-start gap-2 text-sm font-semibold text-slate-800">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700" aria-hidden="true" />
                <span>{shop.address}, {shop.city}, {shop.state} {shop.zip}</span>
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/host-shops/${shop.slug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-red-500"
                >
                  Explore this host shop
                </Link>
                {externalUrl ? (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-brand-blue-700 bg-white px-5 py-2.5 text-sm font-black text-brand-blue-900 hover:bg-sky-50"
                  >
                    {externalLabel} <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-4 sm:px-7">
            <div className="flex gap-2" aria-label="Choose a host shop slide">
              {slides.map(({ shop: item, media }, index) => (
                <button
                  key={`${item.slug}-${media?.src ?? 'no-media'}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-brand-red-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
                  aria-label={`Show ${item.dba ?? item.name}${media ? ` — ${media.alt}` : ''}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-900 hover:bg-slate-50"
                aria-label="Previous host shop"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-900 hover:bg-slate-50"
                aria-label="Next host shop"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
