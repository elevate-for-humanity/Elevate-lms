/**
 * /programs/[slug]/training
 *
 * Learner-facing program training page.
 * Shows all training items for a program in a card grid with cover images.
 *   - Internal LMS courses  → "Start Course" / "Continue" → /courses/[id]/learn
 *   - External partner items → "Go to Partner Training" → external URL
 *
 * Requires authentication. Unauthenticated users are redirected to login.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  BookOpen, ExternalLink, Clock, Award, CheckCircle2,
  Lock, ArrowRight, Info,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const db = createAdminClient();
  const { data: program } = await db
    .from('programs')
    .select('title, description')
    .or(`slug.eq.${slug},code.eq.${slug}`)
    .maybeSingle();

  return {
    title: program ? `${program.title} — Training | Elevate` : 'Program Training | Elevate',
    description: program?.description ?? undefined,
  };
}

// ── Cover image map ────────────────────────────────────────────────────────────
// Maps course category keywords → a real image from public/images/pages/

const COVER_MAP: Record<string, string> = {
  hvac:           '/images/pages/admin-hvac-activation-hero.jpg',
  'heating':      '/images/pages/admin-hvac-activation-hero.jpg',
  'cooling':      '/images/pages/admin-hvac-activation-hero.jpg',
  cdl:            '/images/pages/cdl-training.jpg',
  'truck':        '/images/pages/cdl-truck-highway.jpg',
  'driving':      '/images/pages/cdl-driver-seat.jpg',
  cna:            '/images/pages/cna-patient-care.jpg',
  'nursing':      '/images/pages/cna-nursing-real.jpg',
  'clinical':     '/images/pages/cna-clinical.jpg',
  'healthcare':   '/images/pages/cna-vitals.jpg',
  'medical':      '/images/pages/cna-nursing.jpg',
  'phlebotomy':   '/images/pages/cna-clinical.jpg',
  cyber:          '/images/pages/cybersecurity.jpg',
  'security':     '/images/pages/cybersecurity-screen.jpg',
  'it ':          '/images/pages/cybersecurity-code.jpg',
  'network':      '/images/pages/cybersecurity-code.jpg',
  electrical:     '/images/pages/electrical-panel.jpg',
  'wiring':       '/images/pages/electrical-conduit.jpg',
  welding:        '/images/pages/comp-highlights-welding.jpg',
  'fabrication':  '/images/pages/comp-highlights-welding.jpg',
  tax:            '/images/pages/admin-tax-preparers-hero.jpg',
  'accounting':   '/images/pages/admin-tax-preparers-hero.jpg',
  barber:         '/images/barber-hero.jpg',
  'cosmetology':  '/images/barber-hero.jpg',
  business:       '/images/pages/about-career-training.jpg',
  'management':   '/images/pages/about-career-training.jpg',
  construction:   '/images/pages/construction-trades.jpg',
  'trades':       '/images/pages/skilled-trades-sector.jpg',
  plumbing:       '/images/pages/construction-trades.jpg',
  carpentry:      '/images/pages/construction-trades.jpg',
};

const DEFAULT_COVER = '/images/pages/about-career-training.jpg';

function getCoverImage(category: string | null, title: string | null): string {
  const text = `${(category ?? '')} ${(title ?? '')}`.toLowerCase();
  for (const [keyword, img] of Object.entries(COVER_MAP)) {
    if (text.includes(keyword)) return img;
  }
  return DEFAULT_COVER;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface InternalItem {
  kind: 'internal';
  sort_order: number;
  is_required: boolean;
  link_id: string;
  course: {
    id: string;
    title: string | null;
    course_name: string | null;
    slug: string | null;
    description: string | null;
    duration_hours: number | null;
    category: string | null;
    status: string | null;
    thumbnail_url: string | null;
  };
  enrolled: boolean;
}

interface ExternalItem {
  kind: 'external';
  sort_order: number;
  is_required: boolean;
  id: string;
  partner_name: string;
  title: string;
  external_url: string;
  description: string | null;
  duration_display: string | null;
  credential_type: string | null;
  credential_name: string | null;
  enrollment_instructions: string | null;
  opens_in_new_tab: boolean;
  manual_completion_enabled: boolean;
  completed: boolean;
}

type TrainingItem = InternalItem | ExternalItem;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProgramTrainingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/programs/${slug}/training`);

  const { data: program } = await db
    .from('programs')
    .select('id, title, slug, code, description, category, estimated_weeks, estimated_hours')
    .or(`slug.eq.${slug},code.eq.${slug}`)
    .maybeSingle();

  if (!program) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Program not found</h1>
          <Link href="/programs" className="text-brand-blue-600 hover:underline mt-4 inline-block">
            Browse programs →
          </Link>
        </div>
      </div>
    );
  }

  const { data: internalLinks } = await db
    .from('program_courses')
    .select(`
      id, sort_order, is_required,
      course:training_courses(id, title, course_name, slug, description, duration_hours, category, status, thumbnail_url)
    `)
    .eq('program_id', program.id)
    .order('sort_order');

  const { data: externalRows } = await db
    .from('program_external_courses')
    .select('*')
    .eq('program_id', program.id)
    .eq('is_active', true)
    .order('sort_order');

  const internalCourseIds = (internalLinks ?? []).map((l: any) => l.course?.id).filter(Boolean);
  const { data: enrollments } = internalCourseIds.length > 0
    ? await db
        .from('training_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .in('course_id', internalCourseIds)
    : { data: [] };
  const enrolledSet = new Set((enrollments ?? []).map((e: any) => e.course_id));

  const externalIds = (externalRows ?? []).map((e: any) => e.id);
  const { data: extCompletions } = externalIds.length > 0
    ? await db
        .from('program_external_completions')
        .select('external_course_id')
        .eq('user_id', user.id)
        .in('external_course_id', externalIds)
    : { data: [] };
  const completedExternalSet = new Set((extCompletions ?? []).map((c: any) => c.external_course_id));

  const items: TrainingItem[] = [
    ...(internalLinks ?? []).map((l: any): InternalItem => ({
      kind: 'internal',
      sort_order: l.sort_order ?? 0,
      is_required: l.is_required ?? true,
      link_id: l.id,
      course: l.course ?? {},
      enrolled: enrolledSet.has(l.course?.id),
    })),
    ...(externalRows ?? []).map((e: any): ExternalItem => ({
      kind: 'external',
      sort_order: e.sort_order ?? 0,
      is_required: e.is_required ?? true,
      id: e.id,
      partner_name: e.partner_name,
      title: e.title,
      external_url: e.external_url,
      description: e.description,
      duration_display: e.duration_display,
      credential_type: e.credential_type,
      credential_name: e.credential_name,
      enrollment_instructions: e.enrollment_instructions,
      opens_in_new_tab: e.opens_in_new_tab ?? true,
      manual_completion_enabled: e.manual_completion_enabled ?? true,
      completed: completedExternalSet.has(e.id),
    })),
  ].sort((a, b) => a.sort_order - b.sort_order);

  const totalRequired = items.filter(i => i.is_required).length;
  const completedRequired = items.filter(i => {
    if (!i.is_required) return false;
    if (i.kind === 'internal') return i.enrolled;
    return i.completed;
  }).length;

  const programCode = program.code || program.slug || slug;
  const progressPct = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: program.title, href: `/programs/${programCode}` },
            { label: 'Training' },
          ]} />
          <div className="mt-4 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>
              {program.description && (
                <p className="text-slate-500 mt-1 text-sm max-w-2xl">{program.description}</p>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
                {program.estimated_weeks && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {program.estimated_weeks} weeks
                  </span>
                )}
                {program.category && (
                  <span className="px-2 py-0.5 bg-white rounded-full text-xs font-medium text-slate-600">
                    {program.category}
                  </span>
                )}
              </div>
            </div>

            {/* Progress ring */}
            {totalRequired > 0 && (
              <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke="#2563eb" strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900">
                    {progressPct}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Progress</p>
                  <p className="text-lg font-bold text-slate-900">
                    {completedRequired}
                    <span className="text-slate-400 text-sm font-normal">/{totalRequired}</span>
                  </p>
                  <p className="text-xs text-slate-400">required complete</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No training items yet</p>
            <p className="text-slate-400 text-sm mt-1">Check back soon or contact your advisor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) =>
              item.kind === 'internal'
                ? <InternalCard key={item.link_id} item={item} index={idx} />
                : <ExternalCard key={item.id} item={item} index={idx} />
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-10">
          Questions about your program?{' '}
          <Link href="/contact" className="text-brand-blue-600 hover:underline">
            Contact your advisor
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Internal course card ──────────────────────────────────────────────────────

function InternalCard({ item, index }: { item: InternalItem; index: number }) {
  const c = item.course;
  const label = c.title || c.course_name || 'Untitled Course';
  const isPublished = c.status === 'published';
  const href = isPublished ? `/courses/${c.id}/learn` : null;
  const cover = c.thumbnail_url || getCoverImage(c.category, label);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${
      item.enrolled ? 'border-brand-blue-200' : 'border-slate-200'
    }`}>
      {/* Cover image */}
      <div className="relative h-44 w-full bg-white">
        <Image
          src={cover}
          alt={label}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Step badge */}
        <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 text-slate-700 text-xs font-bold flex items-center justify-center shadow">
          {index + 1}
        </div>
        {/* Status badge */}
        {item.enrolled && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            <CheckCircle2 className="w-3 h-3" /> Enrolled
          </div>
        )}
        {!item.is_required && (
          <div className="absolute bottom-3 right-3 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
            Optional
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-600 mb-1">
          LMS Course
        </span>
        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{label}</h3>
        {c.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{c.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
          {c.duration_hours && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{c.duration_hours}h
            </span>
          )}
          {c.category && (
            <span className="px-2 py-0.5 bg-white rounded-full">{c.category}</span>
          )}
        </div>

        <div className="mt-4">
          {href ? (
            <Link
              href={href}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-blue-700 transition-colors"
            >
              {item.enrolled ? 'Continue' : 'Start Course'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-white text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed">
              <Lock className="w-4 h-4" /> Not yet available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── External partner card ─────────────────────────────────────────────────────

function ExternalCard({ item, index }: { item: ExternalItem; index: number }) {
  const cover = getCoverImage(item.credential_type, item.title);

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow ${
      item.completed ? 'border-green-200' : 'border-teal-200'
    }`}>
      {/* Cover image */}
      <div className="relative h-44 w-full bg-white">
        <Image
          src={cover}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 text-slate-700 text-xs font-bold flex items-center justify-center shadow">
          {index + 1}
        </div>
        {item.completed && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            <CheckCircle2 className="w-3 h-3" /> Complete
          </div>
        )}
        {!item.is_required && (
          <div className="absolute bottom-3 right-3 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
            Optional
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Partner Training
          </span>
          <span className="text-xs text-slate-400">· {item.partner_name}</span>
        </div>
        <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
          {item.duration_display && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.duration_display}</span>
          )}
          {item.credential_name && (
            <span className="flex items-center gap-1"><Award className="w-3 h-3" />{item.credential_name}</span>
          )}
        </div>

        {item.enrollment_instructions && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">{item.enrollment_instructions}</p>
          </div>
        )}

        <div className="mt-4">
          <a
            href={item.external_url}
            target={item.opens_in_new_tab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Partner Training
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
