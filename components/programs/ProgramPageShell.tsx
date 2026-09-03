import { ReactNode } from 'react';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type ProgramPageShellProps = {
  title: string;
  subtitle: string;
  blurb: string;
  credential: string;
  duration: string;
  schedule: string;
  location?: string;
  funding: string;
  audience: string;
  outcomes: string[];
  highlights: string[];
  employerNotes?: string;
  applyHref?: string;
  videoUrl?: string;
  heroImage?: string;
  children?: ReactNode;
};

export function ProgramPageShell({
  title,
  subtitle,
  blurb,
  credential,
  duration,
  schedule,
  location,
  funding,
  audience,
  outcomes,
  highlights,
  employerNotes,
  applyHref = '/apply',
  videoUrl,
  heroImage,
  children,
}: ProgramPageShellProps) {
  return (
    <main>
      {/* HERO */}
      <Section className="pb-6">
        <div className="container-padded grid gap-10 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-start">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-500">
              {PLATFORM_DEFAULTS.orgName} • Funded Program
            </p>
            <h1>{title}</h1>
            <p className="text-sm md:text-base text-black">{subtitle}</p>
            <p className="text-sm md:text-base text-black">{blurb}</p>

            <div className="flex flex-wrap gap-3">
              <Link href={applyHref}>
                <Button size="lg">Start my eligibility check</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  Talk to an Elevate navigator
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-6 text-xs text-black">
              <div>
                <p className="text-base font-bold text-black">{credential}</p>
                <p>Credential / outcome</p>
              </div>
              <div>
                <p className="text-base font-bold text-black">{duration}</p>
                <p>Approximate program length</p>
              </div>
              <div>
                <p className="text-base font-bold text-black">{schedule}</p>
                <p>Schedule</p>
              </div>
            </div>
          </div>

          {/* Right side: Image, Video or Program snapshot */}
          <div className="space-y-4">
            {heroImage && (
              <Card className="p-0 overflow-hidden">
                <div className="relative aspect-[4/3] w-full">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
                  <Image
                    src={heroImage}
                    alt={title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority placeholder="empty"
                  />
                </div>
              </Card>
            )}
            {videoUrl && (
              <Card className="p-0 overflow-hidden">
                <video
                  controls
                  playsInline
                  className="w-full aspect-video"
                  poster={videoUrl.replace('.mp4', '-poster.jpg')}
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Card>
            )}

            <Card className="p-5 md:p-6 space-y-4">
              <h3 className="text-lg font-semibold text-black">Program at a glance</h3>
              <dl className="space-y-2 text-sm text-black">
                {location && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="font-medium text-right">{location}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Funding</dt>
                  <dd className="font-medium text-right">{funding}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Best for</dt>
                  <dd className="font-medium text-right">{audience}</dd>
                </div>
              </dl>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
                  Program highlights
                </p>
                <ul className="space-y-1 text-xs md:text-sm text-black">
                  {highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              {employerNotes && (
                <div className="pt-4 border-t border-dashed border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">For employers</p>
                  <p className="text-xs text-black">{employerNotes}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Section>

      {/* OUTCOMES + EXTRA CONTENT */}
      <Section className="pt-0">
        <div className="container-padded grid gap-8 md:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)] items-start">
          <Card className="p-5 md:p-6 space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">What you'll be able to do</h2>
            <ul className="space-y-2 text-sm md:text-base text-black">
              {outcomes.map((o) => (
                <li key={o}>• {o}</li>
              ))}
            </ul>
          </Card>

          <div className="space-y-4">{children}</div>
        </div>
      </Section>
    </main>
  );
}
