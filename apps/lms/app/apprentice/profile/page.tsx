import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';

export const metadata: Metadata = {
  title: 'Apprentice Profile',
  description: 'Your apprentice profile.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeProfilePage() {
  const { user } = await requireRole(['apprentice','barber_apprentice','cosmetology_apprentice','admin','super_admin','staff']);
  const supabase = await createClient();
  const [{ data: profile }, programSlug] = await Promise.all([
    supabase.from('profiles').select('full_name,email,phone,student_number,address,city,state,zip_code').eq('id', user.id).maybeSingle(),
    resolveApprenticeProgramSlug(supabase, user.id),
  ]);
  const rows = [
    ['Name', profile?.full_name], ['Email', profile?.email || user.email], ['Phone', profile?.phone],
    ['Student number', profile?.student_number], ['Program', programSlug?.replace(/[-_]/g, ' ')],
    ['Address', [profile?.address, profile?.city, profile?.state, profile?.zip_code].filter(Boolean).join(', ')],
  ];
  return <main className="mx-auto max-w-4xl space-y-6"><div><p className="text-xs font-black uppercase tracking-widest text-brand-red-700">Apprentice record</p><h1 className="mt-2 text-3xl font-black">My Profile</h1><p className="mt-2 text-slate-700">Identity and contact information used for apprenticeship records and compliance.</p></div><section className="overflow-hidden rounded-2xl border bg-white"><dl className="divide-y">{rows.map(([label,value]) => <div key={label} className={`grid gap-1 p-5 sm:grid-cols-[180px_1fr] ${value ? '' : 'bg-amber-50'}`}><dt className="font-black text-slate-700">{label}</dt><dd className={value ? 'font-semibold text-slate-950 capitalize' : 'font-black text-amber-900'}>{value || 'Missing — update required'}</dd></div>)}</dl></section><div className="flex flex-wrap gap-3"><Link href="/lms/profile" className="rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Update profile</Link><Link href="/apprentice/documents" className="rounded-xl border border-slate-400 bg-white px-5 py-3 font-black">Documents</Link></div></main>;
}
