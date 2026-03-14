/**
 * /programs/[slug]/training
 *
 * Learner-facing program training page.
 * Shows all training items for a program in display order:
 *   - Internal LMS courses  → "Start Course" button → /courses/[id]/learn
 *   - External partner items → "Go to Partner Training" button → external URL
 *
 * Requires authentication. Unauthenticated users are redirected to login.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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

  // Load program
  const { data: program } = await db
    .from('programs')
    .select('id, title, slug, code, description, category, estimated_weeks, estimated_hours')
    .or(`slug.eq.${slug},code.eq.${slug}`)
    .maybeSingle();

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Program not found</h1>
          <Link href="/programs" className="text-brand-blue-600 hover:underline mt-4 inline-block">
            Browse programs →
          </Link>
        </div>
      </div>
    );
  }

  // Load internal courses via program_courses
  const { data: internalLinks } = await db
    .from('program_courses')
    .select(`
      id, sort_order, is_required,
      course:training_courses(id, title, course_name, slug, description, duration_hours, category, status)
    `)
    .eq('program_id', program.id)
    .order('sort_order');

  // Load external partner items
  const { data: externalRows } = await db
    .from('program_external_courses')
    .select('*')
    .eq('program_id', program.id)
    .eq('is_active', true)
    .order('sort_order');

  // Load user's enrollments for internal courses
  const internalCourseIds = (internalLinks ?? []).map((l: any) => l.course?.id).filter(Boolean);
  const { data: enrollments } = internalCourseIds.length > 0
    ? await db
        .from('training_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .in('course_id', internalCourseIds)
    : { data: [] };
  const enrolledSet = new Set((enrollments ?? []).map((e: any) => e.course_id));

  // Load user's external completions
  const externalIds = (externalRows ?? []).map((e: any) => e.id);
  const { data: extCompletions } = externalIds.length > 0
    ? await db
        .from('program_external_completions')
        .select('external_course_id')
        .eq('user_id', user.id)
        .in('external_course_id', externalIds)
    : { data: [] };
  const completedExternalSet = new Set((extCompletions ?? []).map((c: any) => c.external_course_id));

  // Merge and sort all items by sort_order
  const items: TrainingItem[] = [
    ...(internalLinks ?? []).map((l: any): InternalItem => ({
      kind: 'internal',
      order_index: l.order_index ?? 0 ?? 0,
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
    if (i.kind === 'internal') return i.enrolled; // enrolled = started; full completion tracked separately
    return i.completed;
  }).length;

  const programCode = program.code || program.slug || slug;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: program.title, href: `/programs/${programCode}` },
            { label: 'Training' },
          ]} />
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>
              {program.description && (
                <p className="text-slate-500 mt-1 text-sm max-w-2xl">{program.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                {program.estimated_weeks && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {program.estimated_weeks} weeks
                  </span>
                )}
                {program.category && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
                    {program.category}
                  </span>
                )}
              </div>
            </div>
            {totalRequired > 0 && (
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400 mb-1">Required progress</p>
                <p className="text-2xl font-bold text-slate-900">
                  {completedRequired}
                  <span className="text-slate-400 text-lg font-normal">/{totalRequired}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training items */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No training items yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Check back soon or contact your advisor.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              item.kind === 'internal'
                ? <InternalCard key={item.link_id} item={item} index={idx} />
                : <ExternalCard key={item.id} item={item} index={idx} />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-8">
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        {/* Index badge */}
        <div className="w-9 h-9 rounded-full bg-brand-blue-100 text-brand-blue-700 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-600 bg-brand-blue-50 px-2 py-0.5 rounded-full">
              LMS Course
            </span>
            {!item.is_required && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                Optional
              </span>
            )}
            {item.enrolled && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enrolled
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900">{label}</h3>

          {c.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
            {c.duration_hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {c.duration_hours}h
              </span>
            )}
            {c.category && <span>{c.category}</span>}
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0">
          {href ? (
            <Link
              href={href}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors whitespace-nowrap"
            >
              {item.enrolled ? 'Continue' : 'Start Course'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed">
              <Lock className="w-4 h-4" />
              Not yet available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── External partner card ─────────────────────────────────────────────────────

function ExternalCard({ item, index }: { item: ExternalItem; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-teal-200 overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        {/* Index badge */}
        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              Partner Training
            </span>
            <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              {item.partner_name}
            </span>
            {!item.is_required && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                Optional
              </span>
            )}
            {item.completed && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Marked complete
              </span>
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>

          {item.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
            {item.duration_display && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.duration_display}
              </span>
            )}
            {item.credential_name && (
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                {item.credential_name}
              </span>
            )}
          </div>

          {item.enrollment_instructions && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{item.enrollment_instructions}</p>
            </div>
          )}

          {item.manual_completion_enabled && !item.completed && (
            <p className="text-xs text-slate-400 mt-2">
              After completing this training, your advisor will mark it complete in your record.
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0">
          <a
            href={item.external_url}
            target={item.opens_in_new_tab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            Go to Partner Training
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
