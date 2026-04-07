import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import CompletionApprovalCard from './CompletionApprovalCard';

export const metadata: Metadata = {
  title: 'External Course Approvals | Admin | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ExternalCourseApprovalsPage() {
  const supabase = await createClient();

  const db = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Pending: certificate uploaded but not yet approved
  const { data: pending } = await supabase
    .from('external_course_completions')
    .select(`
      id, user_id, completed_at, certificate_url,
      login_sent_at, login_instructions,
      approved_at, rejection_reason, elevate_sponsored,
      course:program_external_courses(id, title, partner_name, external_url, program_id),
      student:profiles!external_course_completions_user_id_fkey(full_name, email),
      program:programs(title, slug)
    `)
    .not('certificate_url', 'is', null)
    .is('approved_at', null)
    .order('completed_at', { ascending: true });

  // Sponsored but no login sent yet
  const { data: needsLogin } = await supabase
    .from('external_course_completions')
    .select(`
      id, user_id, elevate_sponsored, login_sent_at,
      course:program_external_courses(id, title, partner_name, external_url),
      student:profiles!external_course_completions_user_id_fkey(full_name, email),
      program:programs(title, slug)
    `)
    .eq('elevate_sponsored', true)
    .is('login_sent_at', null)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b px-6 py-3">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'External Course Approvals' },
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Needs login sent ── */}
        {(needsLogin ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Action Required — Send Login Credentials
              </h2>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                {(needsLogin ?? []).length}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              These students are Elevate-sponsored. Purchase the course on the partner site,
              then enter their login credentials below to email them automatically.
            </p>
            <div className="space-y-4">
              {(needsLogin ?? []).map(rec => (
                <CompletionApprovalCard
                  key={rec.id}
                  rec={rec as any}
                  mode="send_login"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Pending credential approval ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-brand-blue-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Pending Credential Review
            </h2>
            <span className="ml-auto text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {(pending ?? []).length}
            </span>
          </div>

          {(pending ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border p-10 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No credentials pending review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(pending ?? []).map(rec => (
                <CompletionApprovalCard
                  key={rec.id}
                  rec={rec as any}
                  mode="approve"
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
