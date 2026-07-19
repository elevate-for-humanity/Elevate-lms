import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  CheckCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Users,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronRight,
  Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Provider Dashboard',
};

export const dynamic = 'force-dynamic';

function getHostFromEnv(value: string | undefined, fallback: string): string {
  const candidate = (value || '').trim();
  if (!candidate) return fallback;

  try {
    return new URL(candidate).host;
  } catch {
    return fallback;
  }
}

export default async function ProviderDashboardPage() {
  const { user } = await requireRole(['provider_admin', 'admin', 'super_admin', 'staff']);
  const supabase = await createClient();
  const db = await requireAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tenant_id) redirect('/unauthorized');

  const tenantId = profile.tenant_id;

  const appHost = getHostFromEnv(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL,
    PLATFORM_DEFAULTS.canonicalDomain,
  );
  const adminHost = getHostFromEnv(
    process.env.NEXT_PUBLIC_ADMIN_URL,
    '',
  );

  const { data: organization } = await db
    .from('organizations')
    .select('id, name, slug, domain')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const { data: tenantDomains } = organization?.id
    ? await db
        .from('tenant_domains')
        .select('domain, status, verified_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
    : { data: null };

  const [
    { data: onboardingSteps },
    { count: programCount },
    { count: enrollmentCount },
    { count: completedCount },
    { count: certCount },
    { data: complianceArtifacts },
    { data: recentPrograms },
  ] = await Promise.all([
    supabase
      .from('provider_onboarding_steps')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at'),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed'),
    supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('provider_compliance_artifacts')
      .select('id, label, expires_at, verified')
      .eq('tenant_id', tenantId),
    supabase
      .from('programs')
      .select('id, title, status, published, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const steps = onboardingSteps ?? [];
  const doneCount = steps.filter((s: any) => s.completed).length;
  const totalSteps = steps.length;
  const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const nextStep = steps.find((s: any) => !s.completed);

  const expiringCount = (complianceArtifacts ?? []).filter((a: any) => {
    if (!a.expires_at) return false;
    return Math.ceil((new Date(a.expires_at).getTime() - Date.now()) / 86400000) <= 30;
  }).length;

  const domainRecord = tenantDomains?.[0] ?? null;
  const customDomain = domainRecord?.domain ?? null;
  const dnsStatus = domainRecord?.status ?? null;
  const verifiedAt = domainRecord?.verified_at
    ? new Date(domainRecord.verified_at).toLocaleDateString()
    : null;

  const firstName = profile.full_name?.split(' ')[0] ?? '';

  const stats = [
    {
      label: 'Programs',
      value: String(programCount ?? 0),
      icon: BookOpen,
      color: 'text-brand-blue-600',
      bg: 'bg-brand-blue-50',
    },
    {
      label: 'Enrollments',
      value: String(enrollmentCount ?? 0),
      icon: Users,
      color: 'text-brand-orange-600',
      bg: 'bg-brand-orange-50',
    },
    {
      label: 'Completions',
      value: String(completedCount ?? 0),
      icon: TrendingUp,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
    {
      label: 'Certificates',
      value: String(certCount ?? 0),
      icon: Award,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {firstName ? `Welcome, ${firstName}` : 'Provider Dashboard'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Provider portal</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: 'Programs', href: '/provider/programs' },
              { label: 'Compliance', href: '/provider/compliance' },
              { label: 'Settings', href: '/provider/settings' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
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
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-brand-blue-300 flex-shrink-0" />
                  )}
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
                    nextStep.step === 'profile_complete'
                      ? '/provider/settings'
                      : nextStep.step === 'mou_signed'
                        ? '/provider/compliance'
                        : nextStep.step.includes('program')
                          ? '/provider/programs'
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

        {/* Compliance alert */}
        {expiringCount > 0 && (
          <div className="bg-slate-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <p className="text-sm font-semibold text-yellow-800">
                {expiringCount} compliance item{expiringCount > 1 ? 's' : ''} expiring within 30
                days
              </p>
            </div>
            <Link
              href="/provider/compliance"
              className="text-sm font-semibold text-yellow-700 hover:underline"
            >
              Review →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-slate-600" />
                <h2 className="font-semibold text-slate-900 text-sm">Domain & DNS</h2>
              </div>
              <p className="text-sm text-slate-500">
                {customDomain
                  ? 'Your custom domain status and the live DNS target.'
                  : 'Set up a custom domain and point DNS to the live application host.'}
              </p>
            </div>
            <Link
              href="/provider/settings"
              className="text-xs text-brand-blue-600 hover:underline font-medium"
            >
              Manage settings →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">Custom Domain</p>
              <p className="text-sm font-semibold text-slate-900">
                {customDomain ?? 'Not configured'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {customDomain
                  ? dnsStatus === 'active' || dnsStatus === 'verified'
                    ? `Verified${verifiedAt ? ` on ${verifiedAt}` : ''}`
                    : `Status: ${dnsStatus ?? 'pending'}`
                  : 'Add a domain in settings to start verification.'}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-1">DNS Target</p>
              <p className="text-sm font-semibold text-slate-900 break-all">{appHost}</p>
              <p className="text-xs text-slate-500 mt-1">
                Create a CNAME from your chosen subdomain to this host.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-brand-blue-200 bg-brand-blue-50 p-4">
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-brand-blue-700 mb-1">Record Type</p>
                <p className="font-semibold text-brand-blue-950">CNAME</p>
              </div>
              <div>
                <p className="text-xs font-medium text-brand-blue-700 mb-1">Host / Name</p>
                <p className="font-semibold text-brand-blue-950">
                  {customDomain ? customDomain.split('.').slice(0, 1).join('.') || '@' : 'training'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-brand-blue-700 mb-1">Value / Target</p>
                <p className="font-semibold text-brand-blue-950 break-all">{appHost}</p>
              </div>
            </div>
            <p className="text-xs text-brand-blue-900 mt-3">
              Admin access remains on {adminHost}. Your public domain goes live after DNS
              propagation and verification.
            </p>
          </div>
        </div>

        {/* Recent programs */}
        {(recentPrograms ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 text-sm">Recent Programs</h2>
              <Link
                href="/provider/programs"
                className="text-xs text-brand-blue-600 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {(recentPrograms ?? []).map((prog) => (
                <div key={prog.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-slate-800">{prog.title ?? '(untitled)'}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      prog.published && prog.is_active
                        ? 'bg-brand-green-100 text-brand-green-700'
                        : prog.status === 'pending_review'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-white text-slate-500'
                    }`}
                  >
                    {prog.published && prog.is_active
                      ? 'Published'
                      : prog.status === 'pending_review'
                        ? 'Under Review'
                        : (prog.status ?? 'Draft')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Manage Programs', href: '/provider/programs' },
              { label: 'View Enrollments', href: '/provider/enrollments' },
              { label: 'Compliance', href: '/provider/compliance' },
              { label: 'Reports', href: '/provider/reports' },
              { label: 'Settings', href: '/provider/settings' },
              { label: 'Support', href: '/contact' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 transition-colors"
              >
                {l.label}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
