import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, BookOpen, Users, Award, ShieldCheck, Globe, ArrowRight } from 'lucide-react';
import { requireProviderPortal } from '@/lib/auth/provider-access';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = { title: 'Provider Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function host(value: string | undefined, fallback: string) { try { return new URL((value || fallback).trim()).host; } catch { return fallback.replace(/^https?:\/\//, ''); } }

function onboardingStepComplete(step: { status?: string | null; completed_at?: string | null }) {
  const status = String(step.status || '').trim().toLowerCase();
  return Boolean(step.completed_at) || ['complete', 'completed', 'approved', 'verified'].includes(status);
}

export default async function ProviderDashboardPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const { tenant } = await searchParams;
  const access = await requireProviderPortal(tenant);
  if (access.isPlatformAdmin && access.platformWide) return <ProviderAdminOversight db={access.db} />;

  const tenantId = access.tenantId!;
  const db = access.db;
  const tenantSuffix = access.isPlatformAdmin ? `?tenant=${encodeURIComponent(tenantId)}` : '';
  const appHost = host(process.env.NEXT_PUBLIC_APP_URL, PLATFORM_DEFAULTS.canonicalDomain);
  const [tenantRes, orgRes, onboardingRes, programsRes, enrollmentsRes, completedRes, certsRes, complianceRes] = await Promise.all([
    db.from('tenants').select('id, name, slug, status, active').eq('id', tenantId).maybeSingle(),
    db.from('organizations').select('id, name, slug, domain').eq('tenant_id', tenantId).maybeSingle(),
    db.from('provider_onboarding_steps').select('id, step, status, completed_at').eq('tenant_id', tenantId).order('created_at'),
    db.from('programs').select('id, title, status, published, is_active, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(8),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'completed'),
    db.from('certificates').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    db.from('provider_compliance_artifacts').select('id, label, expires_at, verified').eq('tenant_id', tenantId),
  ]);
  const organization = orgRes.data;
  const tenantRecord = tenantRes.data;
  const programs = programsRes.data ?? [];
  const onboarding = onboardingRes.data ?? [];
  const onboardingPct = onboarding.length ? Math.round((onboarding.filter(onboardingStepComplete).length / onboarding.length) * 100) : 100;
  const expiring = (complianceRes.data ?? []).filter((row: any) => row.expires_at && new Date(row.expires_at).getTime() <= Date.now() + 30 * 86400000).length;
  const p = (path: string) => `${path}${tenantSuffix}`;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950"><div className="mx-auto max-w-6xl space-y-7">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Provider Portal</p><div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-black">{organization?.name || tenantRecord?.name || 'Training Provider'}</h1><p className="mt-1 text-slate-600">Programs, learners, compliance, and provider operations.</p></div>{access.isPlatformAdmin ? <Link href="/provider/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Back to provider oversight</Link> : null}</div></section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Programs" value={programs.length} icon={BookOpen} /><Metric label="Enrollments" value={enrollmentsRes.count ?? 0} icon={Users} /><Metric label="Completions" value={completedRes.count ?? 0} icon={Award} /><Metric label="Certificates" value={certsRes.count ?? 0} icon={ShieldCheck} /></section>
    {onboardingPct < 100 ? <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex justify-between gap-3"><div><h2 className="font-black text-blue-950">Provider onboarding</h2><p className="text-sm text-blue-800">Complete required setup before all operations are enabled.</p></div><span className="font-black text-blue-900">{onboardingPct}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-200"><div className="h-full bg-blue-700" style={{ width: `${onboardingPct}%` }} /></div></section> : null}
    {expiring > 0 ? <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5"><p className="font-black text-amber-950">{expiring} compliance item{expiring === 1 ? '' : 's'} expire within 30 days.</p><Link href={p('/provider/compliance')} className="mt-2 inline-flex text-sm font-bold text-amber-900">Review compliance <ArrowRight className="ml-1 h-4 w-4" /></Link></section> : null}
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Programs</h2><Link href={p('/provider/programs')} className="text-sm font-bold text-blue-700">Manage programs</Link></div><div className="mt-4 divide-y divide-slate-100">{programs.length ? programs.map((program: any) => <div key={program.id} className="flex items-center justify-between gap-4 py-3"><div><p className="font-bold">{program.title || 'Untitled program'}</p><p className="text-xs text-slate-600">{program.published && program.is_active ? 'Published' : program.status || 'Draft'}</p></div><Link href={p('/provider/programs')} className="text-sm font-bold text-blue-700">Open</Link></div>) : <p className="py-6 text-sm text-slate-600">No programs are assigned to this provider yet.</p>}</div></div>
      <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-700" /><h2 className="font-black">Domain & DNS</h2></div><p className="mt-3 text-sm text-slate-600">Custom domain: <strong>{organization?.domain || 'Not configured'}</strong></p><p className="mt-2 text-sm text-slate-600">Application target: <strong>{appHost}</strong></p><Link href={p('/provider/settings')} className="mt-4 inline-flex text-sm font-bold text-blue-700">Manage settings</Link></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-black">Quick actions</h2><div className="mt-4 grid gap-2"><Quick href={p('/provider/programs')} label="Programs" /><Quick href={p('/provider/compliance')} label="Compliance" /><Quick href={p('/provider/settings')} label="Settings" /></div></section></div>
    </section>
  </div></main>;
}

async function ProviderAdminOversight({ db }: { db: any }) {
  const [{ data: tenants }, { count: pending }] = await Promise.all([
    db.from('tenants').select('id, name, slug, status, active, created_at').eq('type', 'partner_provider').order('created_at', { ascending: false }).limit(100),
    db.from('provider_applications').select('id', { count: 'exact', head: true }).in('status', ['pending', 'under_review']),
  ]);
  const providers = tenants ?? [];
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-6xl"><p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Provider Portal · Admin Oversight</p><h1 className="mt-2 text-4xl font-black">Training provider operations</h1><p className="mt-2 max-w-3xl text-slate-600">Platform-wide oversight without assigning the Admin account to a provider tenant.</p><div className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Providers" value={providers.length} icon={Building2} /><Metric label="Active providers" value={providers.filter((p: any) => p.active || p.status === 'active').length} icon={ShieldCheck} /><Metric label="Pending applications" value={pending ?? 0} icon={Users} /></div><section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black">Provider registry</h2><a href="https://admin.elevateforhumanity.org/providers" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Open Admin provider management</a></div><div className="mt-4 divide-y divide-slate-100">{providers.length ? providers.map((provider: any) => <div key={provider.id} className="flex flex-wrap items-center justify-between gap-4 py-3"><div><p className="font-bold">{provider.name}</p><p className="text-xs text-slate-600">/{provider.slug} · {provider.status || (provider.active ? 'active' : 'inactive')}</p></div><Link href={`/provider/dashboard?tenant=${encodeURIComponent(provider.id)}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold">Open provider view</Link></div>) : <p className="py-6 text-sm text-slate-600">No provider tenants found.</p>}</div></section></div></main>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-blue-700" /><p className="mt-3 text-3xl font-black">{value}</p><p className="text-sm font-semibold text-slate-600">{label}</p></div>; }
function Quick({ href, label }: { href: string; label: string }) { return <Link href={href} className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold hover:bg-slate-200">{label}</Link>; }
