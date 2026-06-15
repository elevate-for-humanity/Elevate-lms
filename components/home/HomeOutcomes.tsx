/**
 * HomeOutcomes
 *
 * Outcomes + success stories section.
 * Stats pulled directly from Supabase (server component, no internal fetch).
 * Testimonials from testimonials table. Falls back to static content.
 */

import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';
import { createPublicClient } from '@/lib/supabase/public';

const FALLBACK_STORIES = [
  {
    id: 'guide',
    name: 'Guide',
    role: 'Barber Apprenticeship Graduate',
    quote:
      'From incarceration to owning my own chair. Elevate gave me structure, accountability, and a real pathway.',
    program: 'Barber Apprenticeship',
  },
  {
    id: 'sharon',
    name: 'Sharon',
    role: 'Medical Assistant Graduate',
    quote:
      "I'm a single mom and thought school wasn't possible. Elevate helped me get funded, stay on track, and step into a real job.",
    program: 'Medical Assistant',
  },
  {
    id: 'alicia',
    name: 'Alicia',
    role: 'Healthcare Graduate',
    quote:
      "They didn't just enroll me and disappear. The coaching and employer connections made the difference.",
    program: 'Healthcare',
  },
];

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  program?: string;
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const db = createPublicClient();
    const { data, error } = await db
      .from('testimonials')
      .select('id, quote, name, role, program')
      .eq('published', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(3);
    if (error || !data?.length) return FALLBACK_STORIES;
    return data as Testimonial[];
  } catch {
    return FALLBACK_STORIES;
  }
}

function StoryCard({ story }: { story: Testimonial }) {
  return (
    <article className="flex flex-col bg-white rounded-2xl border border-slate-200 p-6 gap-4">
      <Quote className="w-6 h-6 text-brand-red-200 shrink-0" aria-hidden="true" />
      <p className="text-slate-700 text-sm leading-relaxed flex-1 italic">
        &ldquo;{story.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <div
          className="w-9 h-9 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
          aria-hidden="true"
        >
          {story.name.charAt(0)}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900">{story.name}</p>
          {story.role && <p className="text-[11px] text-slate-500">{story.role}</p>}
        </div>
        {story.program && (
          <span className="ml-auto text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded-full">
            {story.program}
          </span>
        )}
      </div>
    </article>
  );
}

export async function HomeOutcomes() {
  const stories = await fetchTestimonials();
  const verified = await loadVerifiedPublicStats();

  return (
    <section className="bg-slate-900 py-16 px-4" aria-labelledby="outcomes-heading">
      <div className="max-w-6xl mx-auto">
        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[
            {
              stat: verified.placementDisplay,
              label: 'Credential attainment rate',
              note: 'Among completers',
            },
            {
              stat: verified.studentsDisplay,
              label: 'Learners served',
              note: 'Verified count when available',
            },
            {
              stat: '$0',
              label: 'Cost for eligible students',
              note: 'WIOA & state funding',
            },
            {
              stat: verified.programsDisplay,
              label: 'Programs available',
              note: 'Across 6 sectors',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center px-4 py-5 rounded-2xl bg-slate-800 border border-slate-700"
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{item.stat}</p>
              <p className="text-slate-300 text-xs font-semibold leading-snug mb-1">
                {item.label}
              </p>
              <p className="text-slate-400 text-[10px]">{item.note}</p>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">
              Success Stories
            </p>
            <h2
              id="outcomes-heading"
              className="text-2xl sm:text-3xl font-extrabold text-white"
            >
              Real people. Real outcomes.
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg">
              Elevate is built around people — not just programs. These are the outcomes when
              funding, training, and employers line up.
            </p>
          </div>
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-semibold transition-colors shrink-0"
          >
            More stories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Story cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>

        <p className="mt-8 text-center text-slate-300 text-xs">
          Figures based on internal participant and credential records. Eligibility and outcomes
          vary by program and funding source.{' '}
          <Link
            href="/impact/methodology"
            className="font-semibold text-sky-300 underline hover:text-white transition-colors"
          >
            See methodology
          </Link>
        </p>
      </div>
    </section>
  );
}
