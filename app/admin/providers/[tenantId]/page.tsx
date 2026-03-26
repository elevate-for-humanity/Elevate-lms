import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  Building2, CheckCircle, XCircle, Clock, AlertTriangle,
  Users, BookOpen, GraduationCap, ShieldCheck,
} from 'lucide-react';
import ProviderActions from './ProviderActions';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ tenantId: string }> }
): Promise<Metadata> {
  return { title: 'Provider Detail | Admin' };
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/admin/providers/${tenantId}`);

  const db = createAdminClient();
  if (!db) return <div className="p-8 text-red-600">Database unavailable</div>;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();

  if (!tenant) notFound();

  // Parallel data fetches
  const [
    { data: providerUsers },
    { data: programs, count: programCount },
    { data: complianceArtifacts },
    { data: onboardingSteps },
    { data: auditEvents },
    { count: enrollmentCount },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at'),
    supabase.from('programs')
      .select('id, title, status, published, is_active, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('provider_compliance_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('expires_at', { ascending: true }),
    supabase.from('provider_onboarding_steps')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at'),
    supabase.from('admin_audit_events')
      .select('action, metadata, created_at, actor_user_id')
      .eq('target_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ]);

  const onboardingDone = (onboardingSteps ?? []).filter(s => s.completed).length;
  const onboardingTotal = (onboardingSteps ?? []).length;
  const onboardingPct = onboardingTotal > 0 ? Math.round((onboardingDone / onboardingTotal) * 100) : 0;

  const expiringArtifacts = (complianceArtifacts ?? []).filter(a => {
    if (!a.expires_at) return false;
    const days = Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000);
    return days <= 30;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Providers', href: '/admin/providers' },
          { label: tenant.name },
        ]} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-slate-500">/{tenant.slug}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    tenant.status === 'active' ? 'bg-green-100 text-green-700'
                    : tenant.status === 'suspended' ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tenant.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    Joined {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <ProviderActions tenantId={tenantId} currentStatus={tenant.status} />
          </div>
        </div>

        {/* Alerts */}
        {expiringArtifacts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>{expiringArtifacts.length} compliance document{expiringArtifacts.length > 1 ? 's' : ''}</strong> expiring within 30 days:{' '}
              {expiringArtifacts.map(a => a.label).join(', ')}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: 'Programs', value: programCount ?? 0, href: null },
            { icon: Users, label: 'Enrollments', value: enrollmentCount ?? 0, href: null },
            { icon: GraduationCap, label: 'Staff', value: (providerUsers ?? []).length, href: null },
            { icon: ShieldCheck, label: 'Onboarding', value: `${onboardingPct}%`, href: null },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <stat.icon className="w-3.5 h-3.5" />{stat.label}
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Onboarding checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Onboarding Checklist</h2>
            {(onboardingSteps ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No onboarding steps seeded yet.</p>
            ) : (
              <div className="space-y-2">
                {(onboardingSteps ?? []).map(step => (
                  <div key={step.id} className="flex items-center gap-3 text-sm">
                    {step.completed
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                    <span className={step.completed ? 'text-slate-700' : 'text-slate-400'}>
                      {step.step.replace(/_/g, ' ')}
                    </span>
                    {step.completed_at && (
                      <span className="text-xs text-slate-400 ml-auto">
                        {new Date(step.completed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance artifacts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Compliance Documents</h2>
            {(complianceArtifacts ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {(complianceArtifacts ?? []).map(artifact => {
                  const daysLeft = artifact.expires_at
                    ? Math.ceil((new Date(artifact.expires_at).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <div key={artifact.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        {artifact.verified
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <Clock className="w-3.5 h-3.5 text-slate-300" />}
                        <span className="text-slate-700">{artifact.label}</span>
                        <span className="text-xs text-slate-400 capitalize">{artifact.artifact_type}</span>
                      </div>
                      {daysLeft != null && (
                        <span className={`text-xs font-medium ${
                          daysLeft <= 0 ? 'text-red-600'
                          : daysLeft <= 30 ? 'text-yellow-600'
                          : 'text-slate-400'
                        }`}>
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Programs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Programs ({programCount ?? 0})</h2>
          </div>
          {(programs ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No programs submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {(programs ?? []).map(prog => (
                <div key={prog.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-800 font-medium">{prog.title ?? '(untitled)'}</span>
                  <div className="flex items-center gap-2">
                    {prog.published && prog.is_active
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Published</span>
                      : prog.status === 'pending_review'
                      ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Pending Review</span>
                      : <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{prog.status ?? 'Draft'}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Staff</h2>
          {(providerUsers ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No staff accounts yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {(providerUsers ?? []).map(u => (
                <div key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-slate-800">{u.full_name ?? u.email}</span>
                    {u.full_name && <span className="text-slate-400 ml-2 text-xs">{u.email}</span>}
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                    {u.role?.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Audit Log</h2>
          {(auditEvents ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No audit events yet.</p>
          ) : (
            <div className="divide-y divide-slate-50 text-sm">
              {(auditEvents ?? []).map((evt, i) => (
                <div key={i} className="flex items-start justify-between py-2.5 gap-4">
                  <div>
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {evt.action}
                    </span>
                    {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                      <span className="text-slate-400 text-xs ml-2">
                        {Object.entries(evt.metadata as Record<string, string>)
                          .filter(([k]) => !['tenant_id', 'provider_user_id'].includes(k))
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
