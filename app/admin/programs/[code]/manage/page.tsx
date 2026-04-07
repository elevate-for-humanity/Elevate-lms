import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramManagerClient from './ProgramManagerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ code: string }> }
): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Manage Program · ${code} | Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function ManageProgramPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = createAdminClient();


  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'org_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Load program — try code first, then slug
  let program: any = null;
  const { data: byCode } = await supabase
    .from('programs')
    .select('id, title, code, slug')
    .eq('code', code)
    .maybeSingle();
  if (byCode) {
    program = byCode;
  } else {
    const { data: bySlug } = await supabase
      .from('programs')
      .select('id, title, code, slug')
      .eq('slug', code)
      .maybeSingle();
    program = bySlug;
  }

  if (!program) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Program not found</h1>
        <p className="text-slate-500 mt-2">No program with code or slug &quot;{code}&quot;</p>
        <a href="/admin/programs" className="text-brand-blue-600 hover:underline mt-4 inline-block">
          ← Back to programs
        </a>
      </div>
    );
  }

  const programCode = program.code || program.slug || code;

  // Load attached internal courses
  const { data: internalLinks } = await supabase
    .from('program_courses')
    .select(`
      id, order_index, is_required,
      course:training_courses(id, title, course_name, slug, status, duration_hours, category)
    `)
    .eq('program_id', program.id)
    .order('order_index');

  // Load external partner training items
  const { data: externalItems } = await supabase
    .from('program_external_courses')
    .select('*')
    .eq('program_id', program.id)
    .eq('is_active', true)
    .order('order_index');

  // Load all published + draft courses for the attach picker
  const { data: availableCourses } = await supabase
    .from('training_courses')
    .select('id, title, course_name, status, category')
    .in('status', ['published', 'draft'])
    .order('title');

  // Load credentials already linked to this program
  const { data: linkedCredentials } = await supabase
    .from('program_credentials')
    .select(`
      id, is_required, sort_order, notes,
      credential:credential_registry(
        id, name, abbreviation, issuer_type, credential_stack,
        competency_area, stack_level, issuing_authority, is_active
      )
    `)
    .eq('program_id', program.id)
    .order('sort_order');

  // Load all active credentials for the picker
  const { data: allCredentials } = await supabase
    .from('credential_registry')
    .select('id, name, abbreviation, issuer_type, credential_stack, competency_area, stack_level')
    .eq('is_active', true)
    .order('credential_stack')
    .order('name');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Programs', href: '/admin/programs' },
          { label: program.title, href: `/admin/programs/${programCode}/dashboard` },
          { label: 'Manage Training' },
        ]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{program.title}</h1>
          <p className="text-slate-500 mt-1">
            Manage credentials, internal LMS courses, and external partner training for this program.
          </p>
        </div>

        <ProgramManagerClient
          programId={program.id}
          programCode={programCode}
          programTitle={program.title}
          initialInternalLinks={(internalLinks ?? []) as any}
          initialExternalItems={(externalItems ?? []) as any}
          availableCourses={(availableCourses ?? []) as any}
          initialLinkedCredentials={(linkedCredentials ?? []) as any}
          allCredentials={(allCredentials ?? []) as any}
        />
      </div>
    </div>
  );
}
