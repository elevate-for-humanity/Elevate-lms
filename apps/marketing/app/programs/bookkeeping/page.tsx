import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicPageLead } from '@/components/site/PublicPageLead';

export const metadata: Metadata = {
  title: 'Bookkeeping & Financial Literacy | Elevate for Humanity',
  description: 'Watch Elevate’s conversation with Michael Hoover of Regions Bank about financial literacy, bookkeeping, and business training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/bookkeeping' },
};

export default function BookkeepingVideoPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicPageLead
        image="/images/refresh-20261014/business.webp"
        alt="Instructor and learners reviewing business and bookkeeping records on laptops"
        actions={[]}
      />
      <section className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-800">Elevate for Humanity</p>
        <h1 className="text-3xl font-black sm:text-5xl">Bookkeeping &amp; financial literacy</h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-700">
          Explore how financial literacy, bookkeeping, and business training connect with practical banking conversations.
        </p>
        <section aria-labelledby="michael-video" className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h2 id="michael-video" className="text-2xl font-bold">Meet Michael Hoover of Regions Bank</h2>
          <p className="leading-7 text-slate-700">Watch our 1-minute, 17-second spotlight, narrated by PARIS.</p>
          <iframe
            title="Elevate Meets Regions Bank — Michael Hoover — PARIS"
            src="https://open.spotify.com/embed/episode/5oL9hZPhgmCkXOliXYY15l?utm_source=generator"
            className="h-[352px] w-full rounded-xl border-0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
          <a href="https://open.spotify.com/episode/5oL9hZPhgmCkXOliXYY15l?si=fAU1rSNPQgqLRAEd-UVWhw" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl bg-blue-800 px-5 py-3 font-bold text-white">
            Watch the full video on Spotify
          </a>
          <p className="text-sm text-slate-600">For video playback, open the episode on Spotify.</p>
        </section>
        <aside className="rounded-xl bg-slate-50 p-5 text-slate-700">
          <p>New enrollment for this offering is currently closed. Current students can continue through their student dashboard.</p>
          <Link href="https://app.elevateforhumanity.org/learner/dashboard" className="mt-3 inline-flex min-h-11 items-center font-bold text-blue-800 underline">Open student dashboard</Link>
        </aside>
      </section>
    </main>
  );
}
