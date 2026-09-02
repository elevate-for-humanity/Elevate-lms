'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { stopAllNaturalVoicePlayback } from '@/components/voice/useNaturalVoice';
import type {
  FeaturedHostPartner,
  FeaturedHostPartnerMedia,
} from '@/lib/apprenticeship-programs/host-partners';

const ROTATION_MS = 9000;
type ShowcaseMedia = FeaturedHostPartnerMedia & { backdropSrc?: string };

const FEATURED_MEDIA_BY_SHOP: Record<string, ShowcaseMedia> = {
  'kountry-kutz-barbershop': {
    src: '/images/partners/kountry-kutz-interior.webp',
    alt: 'Interior of Kountry Kutz apprenticeship host barbershop',
    kind: 'photo',
  },
  'cals-kutz-studio': {
    src: '/images/partners/cals-kutz-official.webp',
    alt: 'Cals Kutz Studio apprenticeship host barbershop',
    kind: 'photo',
  },
  'razors-image-barbershop': {
    src: '/videos/partners/razors-image-host-barbershop.mp4',
    alt: "Razor's Image owner describing the barber apprenticeship opportunity",
    kind: 'video',
    backdropSrc: '/images/partners/razors-image-video-poster.webp',
  },
  'b-52s-barber-shop': {
    src: '/images/partners/b52s-official.webp',
    alt: "B-52's Barbershop in New Castle",
    kind: 'photo',
  },
  'salon-saloon': {
    src: '/videos/partners/salon-saloon-tour.mp4',
    alt: 'Walk-through tour of participating apprenticeship Host Shop Salon Saloon',
    kind: 'video',
    backdropSrc: '/images/partners/salon-saloon/team-sign.webp',
  },
};

export default function HostShopShowcase({
  shops,
  videoTourShopSlug,
  autoPlayVideoOnVisible = false,
  narration,
}: {
  shops: FeaturedHostPartner[];
  /** Limit video playback to the designated tour while retaining other shops as still slides. */
  videoTourShopSlug?: string;
  /** Start the designated tour, muted, when its section enters the viewport. */
  autoPlayVideoOnVisible?: boolean;
  /** Page-specific natural narration used while this section is dominant. */
  narration?: string;
}) {
  // Shops without verified media remain in the directory below, but do not
  // become empty decorative slides in the rotating gallery.
  // Keep the rotation representative and brisk: one real photo per shop,
  // instead of letting shops with large portfolios dominate the carousel.
  const slides = useMemo(
    () =>
      shops.flatMap((shop) => {
        const featured = FEATURED_MEDIA_BY_SHOP[shop.slug];
        const media: ShowcaseMedia | undefined =
          featured?.kind !== 'video' || !videoTourShopSlug || shop.slug === videoTourShopSlug
            ? (featured ?? shop.media?.find((item) => item.kind !== 'video'))
            : shop.media?.find((item) => item.kind !== 'video');
        return media ? [{ shop, media }] : [];
      }),
    [shops, videoTourShopSlug],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || interacting || reduceMotion || slides.length < 2) return;
    const activeMedia = slides[activeIndex]?.media;
    // Video tours control their own advancement so they always play to completion.
    if (activeMedia?.kind === 'video') return;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, ROTATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, interacting, paused, reduceMotion, slides]);

  useEffect(() => {
    if (!autoPlayVideoOnVisible) return;
    const section = sectionRef.current;
    if (!section || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = section.querySelector<HTMLVideoElement>('video[data-host-shop-tour]');
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          video.muted = true;
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: [0, 0.45, 0.75] },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      section.querySelector<HTMLVideoElement>('video[data-host-shop-tour]')?.pause();
    };
  }, [activeIndex, autoPlayVideoOnVisible]);

  useEffect(() => {
    if (!slides.length) return;
    const nextSlide = slides[(activeIndex + 1) % slides.length];
    if (!nextSlide?.media?.src || nextSlide.media.kind === 'video') return;

    // Warm only the next still image. Treating MP4 tours as images caused the
    // browser to download media users had not reached yet and competed with the
    // visible page for bandwidth.
    const preload = new window.Image();
    preload.src = nextSlide.media.src;
  }, [activeIndex, slides]);

  if (!slides.length) return null;

  const { shop, media: image } = slides[activeIndex];
  const externalLinks = [
    shop.websiteUrl
      ? { href: shop.websiteUrl, label: shop.websiteLabel ?? `Visit ${shop.dba ?? shop.name}` }
      : null,
    shop.bookingUrl ? { href: shop.bookingUrl, label: 'Book an appointment' } : null,
    shop.socialUrl
      ? { href: shop.socialUrl, label: shop.socialLabel ?? `Follow ${shop.dba ?? shop.name}` }
      : null,
    shop.onlineListingUrl
      ? {
          href: shop.onlineListingUrl,
          label: shop.onlineListingLabel ?? `View ${shop.dba ?? shop.name} online`,
        }
      : null,
  ].filter(
    (link, index, links): link is { href: string; label: string } =>
      Boolean(link) && links.findIndex((candidate) => candidate?.href === link.href) === index,
  );

  function go(delta: number) {
    setActiveIndex((current) => (current + delta + slides.length) % slides.length);
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="host-shop-showcase-heading"
      data-scroll-narration
      data-narration={narration ?? 'Meet verified apprenticeship Host Shops and see how supervised workplace training connects apprentices with real businesses.'}
      className="border-y border-sky-200 bg-gradient-to-br from-sky-50 via-white to-orange-50 px-4 py-12 text-slate-950 sm:px-6 sm:py-16"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setInteracting(false);
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-red-700">
              Meet the host-shop network
            </p>
            <h2
              id="host-shop-showcase-heading"
              className="mt-2 max-w-4xl text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl"
            >
              Train in real shops. Discover the businesses behind the apprenticeship.
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
              This rotating showcase introduces approved host shops, where they are located, and how
              to visit, book, or learn more.
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
                <div className="absolute inset-0 isolate flex items-center justify-center overflow-hidden bg-slate-950">
                  {image.backdropSrc ? (
                    <Image
                      src={image.backdropSrc}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="-z-10 scale-110 object-cover opacity-45 blur-xl"
                      aria-hidden="true"
                    />
                  ) : null}
                  <video
                    key={image.src}
                    src={image.src}
                    controls
                    playsInline
                    muted={autoPlayVideoOnVisible}
                    data-host-shop-tour
                    poster={image.backdropSrc}
                    onPlay={(event) => {
                      if (!event.currentTarget.muted) {
                        stopAllNaturalVoicePlayback();
                        event.currentTarget.volume = 1;
                      }
                    }}
                    onLoadedMetadata={(event) => {
                      event.currentTarget.defaultPlaybackRate = 1;
                      event.currentTarget.playbackRate = 1;
                    }}
                    onEnded={(event) => {
                      if (autoPlayVideoOnVisible) {
                        event.currentTarget.currentTime = 0;
                        event.currentTarget.pause();
                      } else {
                        go(1);
                      }
                    }}
                    preload="metadata"
                    className="host-showcase-media-enter h-full max-w-full object-contain shadow-2xl"
                    aria-label={image.alt}
                  />
                </div>
              ) : image && !failedImages.has(image.src) ? (
                <div className="absolute inset-0 isolate flex items-center justify-center overflow-hidden bg-slate-950">
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="-z-10 scale-110 object-cover opacity-40 blur-xl"
                    aria-hidden="true"
                  />
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={activeIndex === 0}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="host-showcase-media-enter object-contain"
                    onError={() =>
                      setFailedImages((current) => {
                        const next = new Set(current);
                        next.add(image.src);
                        return next;
                      })
                    }
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col justify-end bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.32),transparent_42%),linear-gradient(145deg,#1e293b,#020617)] px-8 py-10 sm:px-12 sm:py-12">
                  <p className="max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
                    {shop.dba ?? shop.name}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-300">
                    Local business • {shop.city}, {shop.state}
                  </p>
                </div>
              )}
            </div>

            <div
              className="flex flex-col justify-center p-7 text-slate-950 sm:p-9 lg:p-10"
              aria-live="polite"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                Host Shop gallery image {activeIndex + 1} of {slides.length}
              </p>
              <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                {shop.dba ?? shop.name}
              </h3>
              {shop.dba ? (
                <p className="mt-1 text-sm text-slate-600">Legal name: {shop.name}</p>
              ) : null}
              <p className="mt-5 text-base leading-7 text-slate-700">
                {shop.marketingBlurb ?? shop.note}
              </p>
              <p className="mt-5 flex items-start gap-2 text-sm font-semibold text-slate-800">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700" aria-hidden="true" />
                <span>
                  {shop.address}, {shop.city}, {shop.state} {shop.zip}
                </span>
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/schedule-consultation?type=host-shop-tour"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-brand-red-700"
                >
                  Schedule Your Host Shop Tour
                </Link>
                <Link
                  href={`/host-shops/${shop.slug}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                >
                  Explore this host shop
                </Link>
                {externalLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-brand-blue-700 bg-white px-5 py-2.5 text-sm font-black text-brand-blue-900 hover:bg-sky-50"
                  >
                    {link.label} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
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
      <style jsx>{`
        .host-showcase-media-enter {
          animation: host-showcase-fade 650ms ease-out both;
          transform-origin: center;
        }
        @keyframes host-showcase-fade {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .host-showcase-media-enter {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
