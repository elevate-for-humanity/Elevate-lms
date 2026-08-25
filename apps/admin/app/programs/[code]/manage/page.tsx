import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramManagerClient from './ProgramManagerClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { robots: { index: false }, title: `Manage Program · ${code} | Admin` };
}

export default async function ManageProgramPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'org_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: byCode } = await supabase.from('programs').select('id,title,code,slug').eq('code', code).maybeSingle();
  const { data: bySlug } = byCode ? { data: null } : await supabase.from('programs').select('id,title,code,slug').eq('slug', code).maybeSingle();
  const program = byCode ?? bySlug;

  if (!program?.id) {
    return <div className="p-8"><h1 className="text-2xl font-bold text-slate-900">Program not found</h1><p className="mt-2 text-slate-500">No program with code or slug &quot;{code}&quot;</p><Link href="/programs" className="mt-4 inline-block text-brand-blue-600 hover:underline">← Back to programs</Link></div>;
  }

  const programCode = program.code || program.slug || code;
  const [internalLinksResult, externalItemsResult, availableCoursesResult] = await Promise.all([
    supabase.from('program_courses').select('id,order_index,is_required,course:training_courses(id,title,course_name,slug,status,duration_hours,category)').eq('program_id', program.id).order('order_index'),
    supabase.from('program_external_courses').select('*').eq('program_id', program.id).eq('is_active', true).order('order_index'),
    supabase.from('lms_courses').select('id,title,course_name,status,category').in('status', ['published', 'draft']).order('title'),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Programs', href: '/programs' }, { label: program.title, href: `/programs/${programCode}/dashboard` }, { label: 'Manage Training' }]} />
        <div className="mb-8 mt-6"><h1 className="text-2xl font-bold text-slate-900">{program.title}</h1><p className="mt-1 text-slate-500">Manage internal LMS courses and external partner training for this program.</p></div>
        <ProgramManagerClient
          programId={program.id}
          programCode={programCode}
          programTitle={program.title}
          initialInternalLinks={(internalLinksResult.data ?? []) as any}
          initialExternalItems={(externalItemsResult.data ?? []) as any}
          availableCourses={(availableCoursesResult.data ?? []) as any}
        />
      </div>
    </main>
  );
}
