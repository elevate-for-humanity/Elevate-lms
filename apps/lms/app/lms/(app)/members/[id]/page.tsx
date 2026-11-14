import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CommunityFollowButton from '@/components/lms/CommunityFollowButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Member Profile | Elevate LMS', robots: { index: false, follow: false } };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) redirect('/lms/members');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/lms/members/${id}`);

  const { data: memberRows } = await supabase.rpc('get_community_member', { p_member_id: id });
  const member = memberRows?.[0] ?? null;

  let following = false;
  if (member && member.id !== user.id && member.community_allow_follow) {
    const { data } = await supabase.from('community_follows').select('following_id').eq('follower_id', user.id).eq('following_id', member.id).maybeSingle();
    following = !!data;
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 md:py-8">
      <Link href="/lms/members" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-blue-600"><ArrowLeft className="h-4 w-4" />Back to members</Link>
      {!member ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">This member profile is private or is not available.</div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">{member.avatar_url ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-9 w-9 text-slate-400" />}</div>
            <div className="min-w-0 flex-1"><h1 className="text-3xl font-black text-slate-900">{member.full_name ?? 'Elevate Member'}</h1>{member.community_show_role && member.role && <p className="mt-1 capitalize text-slate-500">{member.role}</p>}</div>
          </div>

          {member.id === user.id ? (
            <div className="mt-7 border-t border-slate-100 pt-5"><Link href="/lms/settings/privacy" className="font-bold text-brand-blue-600 hover:underline">Manage community privacy</Link></div>
          ) : (
            <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              {member.community_allow_messages && <Link href={`/lms/messages/${member.id}`} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white hover:bg-brand-blue-700"><MessageSquare className="h-4 w-4" />Message member</Link>}
              {member.community_allow_follow && <CommunityFollowButton currentUserId={user.id} memberId={member.id} initialFollowing={following} />}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
