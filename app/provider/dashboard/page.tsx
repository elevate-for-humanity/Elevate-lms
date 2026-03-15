import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { CheckCircle, Clock, ArrowRight, BookOpen, Users, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/dashboard');

  const db = createAdminClient()!;

  const { data: profile } = await db
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.tenant_id) redirect('/unauthorized');

  const tenantId = profile.tenant_id;

  const [
    { data: onboardingSteps },
    { count: programCount },
    { count: enrollmentCount },
    { data: complianceArtifacts },
    { data: recentPrograms },
  ] = await Promise.all([
    db.from('provider_onboarding_steps').select('*').eq('tenant_id', tenantId).order('created_at'),
    db.from('programs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('provider_compliance_artifacts').select('id, label, expires_at, verified').eq('tenant_id', tenantId),
    db.from('programs')
      .select('id, title, status, published, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const steps = onboardingSteps ?? [];
  const doneCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const nextStep = steps.find(s => !s.completed);

  const expiringCount = (complianceArtifacts ?? []).filter(a => {
    if (!a.expires_at) return false;
    return Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000) <= 30;
  }).length;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Welcome{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Provider dashboard</p>
      </div>

      {/* Onboarding widget — hidden once 100% complete */}
      {pct < 100 && totalSteps > 0 && (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-blue-900 text-sm">Getting Started</h2>
            <span className="text-xs font-bold text-brand-blue-700">{pct}% complete</span>
          </div>
          <div className="w-full bg-brand-blue-200 rounded-full h-1.5 mb-4">
            <div
              className="bg-white h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {steps.map(step => (
              <div key={step.id} className="flex items-center gap-2 text-sm">
                {step.completed
                  ? <CheckCircle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                  : <Clock className="w-4 h-4 text-brand-blue-300 flex-shrink-0" />}
                <span className={step.completed ? 'text-brand-blue-800' : 'text-brand-blue-500'}>
                  {step.step.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
          {nextStep && (
            <div className="mt-4">
              <Link
                href={
                  nextStep.step === 'profile_complete' ? '/provider/settings'
                  : nextStep.step === 'mou_signed' ? '/provider/compliance'
                  : nextStep.step.includes('program') ? '/provider/programs'
                  : '/provider/dashboard'
                }
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-900 transition"
              >
                Next: {nextStep.step.replace(/_/g, ' ')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <BookOpen className="w-3.5 h-3.5" /> Programs
          </div>
          <div className="text-2xl font-bold text-slate-900">{programCount ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Users className="w-3.5 h-3.5" /> Enrollments
          </div>
          <div className="text-2xl font-bold text-slate-900">{enrollmentCount ?? 0}</div>
        </div>
        <div className={`rounded-xl border p-4 ${expiringCount > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance
          </div>
          <div className={`text-2xl font-bold ${expiringCount > 0 ? 'text-yellow-700' : 'text-slate-900'}`}>
            {expiringCount > 0 ? `${expiringCount} expiring` : 'OK'}
          </div>
        </div>
      </div>

      {/* Recent programs */}
      {(recentPrograms ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 text-sm">Recent Programs</h2>
            <Link href="/provider/programs" className="text-xs text-brand-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(recentPrograms ?? []).map(prog => (
              <div key={prog.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-800">{prog.title ?? '(untitled)'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  prog.published && prog.is_active ? 'bg-green-100 text-green-700'
                  : prog.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-white text-slate-500'
                }`}>
                  {prog.published && prog.is_active ? 'Published'
                    : prog.status === 'pending_review' ? 'Under Review'
                    : prog.status ?? 'Draft'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
