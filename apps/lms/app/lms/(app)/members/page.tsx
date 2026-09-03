import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, User, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Members | Elevate LMS',
  description: 'Connect with members of the Elevate learning community.',
  robots: { index: false, follow: false },
};

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/members');

  const { data: members, error } = await supabase.rpc('get_community_members', { p_search: q || null });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Community</p>
        <h1 className="mt-2 text-3xl font-black">Members</h1>
        <p className="mt-2 max-w-2xl text-slate-300">Find members in your Elevate organization who have chosen to participate in the community directory.</p>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <span>Your student/workforce record is private by default. The directory only receives safe community fields.</span>
        <Link href="/lms/settings/privacy" className="font-bold text-brand-blue-600 hover:underline">Manage my community privacy</Link>
      </div>

      <form className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2" action="/lms/members">
        <Search className="ml-2 h-4 w-4 text-slate-400" />
        <input name="q" defaultValue={q} placeholder="Search visible members" className="min-w-0 flex-1 border-0 px-2 py-2 text-sm outline-none focus:ring-0" />
        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Search</button>
      </form>

      {error ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">The safe member directory function is not available yet. Apply the pending community migration before production traffic.</div>
      ) : !members?.length ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Users className="mx-auto h-10 w-10 text-slate-400" /><p className="mt-3 font-bold text-slate-900">No visible members found.</p><p className="mt-1 text-sm text-slate-600">Members appear here only after opting into the directory.</p></div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member: any) => (
            <Link key={member.id} href={`/lms/members/${member.id}`} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-blue-300 hover:shadow-md">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">{member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-slate-400" />}</div>
              <div className="min-w-0"><p className="truncate font-bold text-slate-900">{member.full_name ?? 'Member'}</p>{member.community_show_role && member.role && <p className="truncate text-sm capitalize text-slate-500">{member.role}</p>}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
