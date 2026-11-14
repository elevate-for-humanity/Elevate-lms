'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type { HeroBannerConfig } from '@/content/heroBanners';
import { stopAllNaturalVoicePlayback } from '@/components/voice/useNaturalVoice';
import recordings from '@/content/program-introduction-recordings.json';
import { buildProgramIntroduction } from '@/lib/programs/program-introduction';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';

/** Register the visible introduction with the site's single narration controller. */
export function ProgramNarration({ text, source }: { text: string; source?: string }) {
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const surface = marker.current?.closest<HTMLElement>('figure, section, article')
      ?? marker.current?.parentElement;
    if (!surface) return;
    const attributes = {
      'data-scroll-narration': '',
      'data-narration': text,
      'data-narration-src': source ?? '',
      'data-narration-style': 'commercial',
    };
    const previous = Object.fromEntries(
      Object.keys(attributes).map(key => [key, surface.getAttribute(key)]),
    );
    Object.entries(attributes).forEach(([key, value]) => surface.setAttribute(key, value));
    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value === null) surface.removeAttribute(key);
        else surface.setAttribute(key, value);
      });
    };
  }, [text, source]);
  return <span ref={marker} className="sr-only">{text}</span>;
}

export function ProgramIntroductionAudio({ program }: { program: ProgramSchema }) {
  const text = buildProgramIntroduction(program);
  const recording = (recordings as Record<string, { text: string; src: string }>)[program.slug];
  return (
    <ProgramNarration text={text} source={recording?.text === text ? recording.src : undefined} />
  );
}

export default function NarratedProgramIntro({
  program,
  banner,
}: {
  program: ProgramSchema;
  banner?: HeroBannerConfig | null;
}) {
  return (
    <figure
      className="border-b border-slate-200 bg-white text-slate-950"
      data-program-visual-intro={program.slug}
    >
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[27rem]">
          {banner?.videoSrcDesktop || banner?.videoSrcMobile ? (
            <video
              controls
              controlsList="nodownload"
              playsInline
              preload="none"
              poster={getProgramHeroImage(program.slug)}
              aria-label={`${program.title} program introduction`}
              onPlay={stopAllNaturalVoicePlayback}
              className="absolute inset-0 h-full w-full bg-black object-contain"
            >
              {banner.videoSrcMobile && banner.videoSrcMobile !== banner.videoSrcDesktop ? (
                <source src={banner.videoSrcMobile} media="(max-width: 767px)" type="video/mp4" />
              ) : null}
              <source src={banner.videoSrcDesktop || banner.videoSrcMobile} type="video/mp4" />
              Your browser does not support embedded video.
            </video>
          ) : (
            <Image
              src={getProgramHeroImage(program.slug)}
              alt={getProgramImageAlt(program.slug, program.title)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          )}
        </div>
        <figcaption className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">
            Elevate for Humanity • Career training
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">{program.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-700">{program.subtitle}</p>
          <ProgramIntroductionAudio program={program} />
        </figcaption>
      </div>
    </figure>
  );
}

export function ProgramLearningPreview({ program }: { program: ProgramSchema }) {
  const modules = program.curriculum.slice(0, 3);
  if (!modules.length) return null;
  return (
    <section
      className="border-y border-orange-200 bg-orange-50/60 px-4 py-10 sm:py-14"
      aria-labelledby={`${program.slug}-learning-preview`}
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">
          Inside the training
        </p>
        <h2
          id={`${program.slug}-learning-preview`}
          className="mt-3 text-3xl font-black text-slate-950"
        >
          See what you’ll build.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {modules.map((module, index) => (
            <article
              key={`${module.title}-${index}`}
              className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-black text-orange-700">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-bold text-slate-950">{module.title}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {module.topics.slice(0, 3).map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
