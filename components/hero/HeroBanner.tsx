'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Mic, Volume2 } from 'lucide-react';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustIndicators?: string[];
  type?: 'image' | 'video';
  videoSrc?: string;
  voiceoverSrc?: string;
  posterSrc?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
};

export default function HeroBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trustIndicators = [],
  type = 'image',
  videoSrc = '/video/hero-home-dec12.mp4',
  voiceoverSrc,
  posterSrc = '/images/artlist/hero-training-3.jpg',
  heroImageSrc = '/images/heroes-hq/programs-hero.jpg',
  heroImageAlt = 'Elevate for Humanity hero banner',
}: HeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  // Video: autoplay muted, pause off-screen
  useEffect(() => {
    if (type !== 'video') return;
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [type]);

  const toggleVoiceover = () => {
    const a = audioRef.current;
    if (!a) return;
    if (voiceActive) {
      a.pause();
      setVoiceActive(false);
    } else {
      a.currentTime = 0;
      a.play().then(() => setVoiceActive(true)).catch(() => {});
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative h-[300px] md:h-[400px] w-full">
        {type === 'video' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={videoSrc}
              muted
              loop
              playsInline
              preload="metadata"
              poster={posterSrc}
            />
            {voiceoverSrc && (
              <>
                <audio ref={audioRef} src={voiceoverSrc} preload="auto" onEnded={() => setVoiceActive(false)} />
                <button
                  onClick={toggleVoiceover}
                  className={`absolute z-20 bottom-4 right-4 flex items-center gap-2 rounded-full shadow-lg px-4 py-2.5 transition-all ${
                    voiceActive
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-brand-red-600 text-white hover:bg-brand-red-700 animate-pulse'
                  }`}
                  aria-label={voiceActive ? 'Stop narration' : 'Listen'}
                >
                  {voiceActive ? (
                    <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold">Playing...</span></>
                  ) : (
                    <><Mic className="w-5 h-5" /><span className="text-sm font-semibold">Listen</span></>
                  )}
                </button>
              </>
            )}
          </>
        ) : (
          <Image
            src={heroImageSrc}
            alt={heroImageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="bg-slate-900 py-10">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
          <p className="mt-3 text-base text-slate-300 md:text-lg max-w-3xl mx-auto">{subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {primaryCta && (
              <a href={primaryCta.href} className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 transition-colors">
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a href={secondaryCta.href} className="inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 transition-colors">
                {secondaryCta.label}
              </a>
            )}
          </div>

          {trustIndicators.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {trustIndicators.map((indicator, i) => (
                <span key={i} className="rounded-full bg-slate-700 px-3 py-2 text-xs font-medium text-slate-300">{indicator}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
