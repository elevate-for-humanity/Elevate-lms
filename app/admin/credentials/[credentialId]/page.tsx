import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CredentialForm from '../CredentialForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ credentialId: string }> }
): Promise<Metadata> {
  const { credentialId } = await params;
  const db = createAdminClient();
  const { data } = await supabase.from('credential_registry').select('name').eq('id', credentialId).single();
  return { title: data ? `${data.name} | Credential Registry` : 'Edit Credential | Admin' };
}

export default async function EditCredentialPage({
  params,
}: {
  params: Promise<{ credentialId: string }>;
}) {
  const { credentialId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','org_admin','staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: credential } = await supabase
    .from('credential_registry')
    .select('*')
    .eq('id', credentialId)
    .single();

  if (!credential) notFound();

  // Load linked training courses
  const { data: linkedCourses } = await supabase
    .from('training_courses')
    .select('id, title, course_name, status')
    .eq('credential_id', credentialId)
    .order('title');

  // Load programs using this credential
  const { data: programLinks } = await supabase
    .from('program_credentials')
    .select('id, is_required, program_id')
    .eq('credential_id', credentialId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Credential Registry', href: '/admin/credentials' },
          { label: credential.name },
        ]} />

        <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">{credential.name}</h1>
        {credential.abbreviation && (
          <p className="text-slate-400 font-mono text-sm mb-6">{credential.abbreviation}</p>
        )}

        {/* Usage summary */}
        {((linkedCourses?.length ?? 0) > 0 || (programLinks?.length ?? 0) > 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-slate-900">{linkedCourses?.length ?? 0}</p>
              <p className="text-xs text-slate-400">Prep courses linked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{programLinks?.length ?? 0}</p>
              <p className="text-xs text-slate-400">Programs using this credential</p>
            </div>
          </div>
        )}

        <CredentialForm mode="edit" initial={credential} />
      </div>
    </div>
  );
}
