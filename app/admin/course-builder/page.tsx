import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import ProgramBuilderClient from '@/components/admin/course-builder/ProgramBuilderClient';
import type {
  ProgramBuilderState,
  ProgramPhase,
  ProgramModule,
  ProgramLesson,
} from '@/components/admin/course-builder/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Program Builder | Admin | Elevate For Humanity',
};

interface PageProps {
  searchParams: Promise<{ program?: string }>;
}

export default async function CourseBuilderPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/course-builder');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
    redirect('/unauthorized');
  }

  const db = createAdminClient();

  // If no program specified, redirect to programs list so admin picks one
  const programId = params.program ?? null;
  if (!programId) redirect('/admin/programs?action=build');

  const { data: program } = await db
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (!program) redirect('/admin/programs?error=not_found');

  // Load related data in parallel
  const [
    { data: outcomesRaw },
    { data: credentialsRaw },
    { data: modulesRaw },
    { data: ctasRaw },
    { data: tracksRaw },
    { data: mediaRaw },
    { data: allCredentials },
  ] = await Promise.all([
    db.from('program_outcomes')
      .select('id, outcome, outcome_order')
      .eq('program_id', programId)
      .order('outcome_order'),

    db.from('program_credentials')
      .select('id, credential_id, is_required, sort_order, credentials(id, name, abbreviation, issuing_authority)')
      .eq('program_id', programId)
      .order('sort_order'),

    db.from('program_modules')
      .select('id, title, sort_order, program_lessons(id, title, lesson_type, sort_order, duration_minutes)')
      .eq('program_id', programId)
      .order('sort_order'),

    db.from('program_ctas')
      .select('id, cta_type, label, href, style_variant, sort_order')
      .eq('program_id', programId)
      .order('sort_order'),

    db.from('program_tracks')
      .select('id, track_code, title, funding_type, cost_cents, available, sort_order')
      .eq('program_id', programId)
      .order('sort_order'),

    db.from('program_media')
      .select('id, media_type, url, alt_text')
      .eq('program_id', programId),

    db.from('credentials')
      .select('id, name, abbreviation, issuing_authority')
      .order('name'),
  ]);

  // Shape modules into a single phase (phase column not yet on program_modules)
  const modules: ProgramModule[] = (modulesRaw ?? []).map((m: any) => ({
    id: m.id,
    title: m.title,
    sort_order: m.sort_order,
    lessons: (m.program_lessons ?? []).map((l: any): ProgramLesson => ({
      id: l.id,
      title: l.title,
      lesson_type: l.lesson_type ?? 'lesson',
      sort_order: l.sort_order,
      duration_minutes: l.duration_minutes ?? null,
      is_published: false,
      has_video: false,
      has_reading: false,
    })),
  }));

  const phases: ProgramPhase[] = modules.length > 0
    ? [{ id: 'default', title: 'Program Curriculum', sort_order: 0, modules }]
    : [];

  const initialState: ProgramBuilderState = {
    id: program.id,
    title: program.title ?? '',
    subtitle: program.name ?? '',
    slug: program.slug ?? '',
    category: program.category ?? '',
    description: program.description ?? program.full_description ?? '',
    hero_image_url: program.hero_image_url ?? program.hero_image ?? program.image_url ?? null,

    outcomes: (outcomesRaw ?? []).map((o: any) => ({
      id: o.id,
      text: o.outcome,
      outcome_order: o.outcome_order,
    })),

    credentials: (credentialsRaw ?? []).map((c: any) => ({
      id: c.id,
      credential_id: c.credential_id,
      credential_name: c.credentials?.name ?? '',
      credential_abbreviation: c.credentials?.abbreviation ?? null,
      is_required: c.is_required,
      is_primary: c.sort_order === 0,
      sort_order: c.sort_order,
    })),

    phases,

    ctas: (ctasRaw ?? []).map((c: any) => ({
      id: c.id,
      cta_type: c.cta_type,
      label: c.label,
      href: c.href,
      style_variant: c.style_variant,
      sort_order: c.sort_order,
    })),

    tracks: (tracksRaw ?? []).map((t: any) => ({
      id: t.id,
      track_code: t.track_code,
      title: t.title,
      funding_type: t.funding_type,
      cost_cents: t.cost_cents,
      available: t.available,
      sort_order: t.sort_order,
    })),

    media: (mediaRaw ?? []).map((m: any) => ({
      id: m.id,
      media_type: m.media_type,
      url: m.url,
      alt_text: m.alt_text,
    })),

    estimated_weeks: program.estimated_weeks ?? program.duration_weeks ?? null,
    estimated_hours: program.estimated_hours ?? program.total_hours ?? program.training_hours ?? null,
    delivery_method: (program.delivery_method ?? null) as ProgramBuilderState['delivery_method'],

    wioa_approved: program.wioa_approved ?? false,
    dol_registered: program.dol_registered ?? false,
    etpl_listed: false,

    status: program.published ? 'published' : 'draft',
    published: program.published ?? false,
  };

  const availableCredentials = (allCredentials ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    abbreviation: c.abbreviation,
    issuing_authority: c.issuing_authority,
  }));

  return (
    <ProgramBuilderClient
      initialState={initialState}
      availableCredentials={availableCredentials}
    />
  );
}
