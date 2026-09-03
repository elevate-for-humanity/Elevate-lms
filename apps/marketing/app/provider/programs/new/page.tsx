import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireProviderPortal } from '@/lib/auth/provider-access';
import { submitProviderProgram } from './actions';

export const metadata: Metadata = { robots: { index: false }, title: 'Submit Program | Provider' };
export const dynamic = 'force-dynamic';

export default async function ProviderProgramsNewPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const { tenant: requestedTenant } = await searchParams;
  const access = await requireProviderPortal(requestedTenant);
  if (access.isPlatformAdmin && access.platformWide) redirect('/provider/dashboard');
  const tenantId = access.tenantId!;
  const backSuffix = access.isPlatformAdmin ? `?tenant=${encodeURIComponent(tenantId)}` : '';

  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-3xl">
    <div className="mb-6"><Link href={`/provider/programs${backSuffix}`} className="text-sm font-bold text-blue-700">← Back to programs</Link><h1 className="mt-3 text-3xl font-black text-slate-950">Submit a training program</h1><p className="mt-2 text-slate-600">Provider submissions enter review status. They cannot publish until Elevate approves them.</p>{access.isPlatformAdmin ? <p className="mt-2 text-xs font-bold text-amber-700">Admin submitting on behalf of tenant {tenantId}</p> : null}</div>
    <form action={submitProviderProgram} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="tenant" value={access.isPlatformAdmin ? tenantId : ''} />
      <Field label="Program title" name="title" required placeholder="Medical Assistant" />
      <Field label="URL slug" name="slug" placeholder="medical-assistant" hint="Optional; generated from the title when blank." />
      <div><label className="mb-1 block text-sm font-bold text-slate-800" htmlFor="description">Description</label><textarea id="description" name="description" rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Program purpose, curriculum, delivery model, and target learner." /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-bold text-slate-800" htmlFor="category">Category</label><select id="category" name="category" className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="workforce">Workforce Development</option><option value="healthcare">Healthcare</option><option value="apprenticeship">Apprenticeship</option><option value="certification">Certification</option><option value="business">Business</option><option value="technology">Technology</option></select></div><Field label="Credential name" name="credential_name" placeholder="CCMA" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Duration (weeks)" name="duration_weeks" type="number" min="1" /><Field label="Seats available" name="seats_available" type="number" min="0" /></div>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Approval control:</strong> submitting this form creates a provider-owned program in pending review and a linked approval record. It does not publish the program.</div>
      <button type="submit" className="w-full rounded-lg bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800">Submit for Elevate review</button>
    </form>
  </div></main>;
}

function Field({ label, name, required = false, placeholder, hint, type = 'text', min }: { label: string; name: string; required?: boolean; placeholder?: string; hint?: string; type?: string; min?: string }) {
  return <div><label className="mb-1 block text-sm font-bold text-slate-800" htmlFor={name}>{label}</label><input id={name} name={name} type={type} min={min} required={required} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-3 py-2" />{hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}</div>;
}
