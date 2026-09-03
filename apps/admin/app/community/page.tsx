import { Metadata } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Eye, MessageSquare, ShieldCheck, Trash2, Trophy, Users, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Community | Admin', robots: { index: false, follow: false } };

async function requireOperator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/community');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin', 'staff'].includes(String(profile?.role || ''))) redirect('/dashboard');
  return user;
}

async function deleteCommunityItem(formData: FormData) {
  'use server';
  await requireOperator();
  const type = String(formData.get('type') || '');
  const id = String(formData.get('id') || '');
  if (!id) return;
  const table = type === 'post' ? 'community_posts'
    : type === 'comment' ? 'community_post_comments'
      : type === 'group' ? 'study_groups'
        : type === 'topic' ? 'forum_topics'
          : type === 'reply' ? 'forum_replies'
            : null;
  if (!table) return;
  const admin = await requireAdminClient();
  await admin.from(table).delete().eq('id', id);
  revalidatePath('/community');
}

async function updateReport(formData: FormData) {
  'use server';
  const user = await requireOperator();
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || '');
  if (!id || !['reviewing', 'resolved', 'dismissed'].includes(status)) return;
  const admin = await requireAdminClient();
  await admin.from('community_reports').update({
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id);
  revalidatePath('/community');
}

export default async function CommunityAdminPage() {
  await requireOperator();
  const admin = await requireAdminClient();

  const [postsResult, groupsResult, topicsResult, commentsResult, likesResult, leadersResult, reportsResult] = await Promise.all([
    admin.from('community_posts').select('id,user_id,content,created_at,likes_count,comments_count,tags').order('created_at', { ascending: false }).limit(50),
    admin.from('study_groups').select('id,name,topic,description,created_at,member_count').order('created_at', { ascending: false }).limit(30),
    admin.from('forum_topics').select('id,title,author_id,reply_count,created_at').order('created_at', { ascending: false }).limit(30),
    admin.from('community_post_comments').select('id', { count: 'exact', head: true }),
    admin.from('community_post_likes').select('id', { count: 'exact', head: true }),
    admin.from('leaderboard_scores').select('user_id,points').is('course_id', null).order('points', { ascending: false }).limit(5),
    admin.from('community_reports').select('id,reporter_id,target_type,target_id,reason,details,status,created_at,reviewed_at').in('status', ['open', 'reviewing']).order('created_at', { ascending: false }).limit(100),
  ]);

  const posts = postsResult.data ?? [];
  const groups = groupsResult.data ?? [];
  const topics = topicsResult.data ?? [];
  const leaders = leadersResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const userIds = [...new Set([
    ...posts.map((row: any) => row.user_id),
    ...topics.map((row: any) => row.author_id),
    ...leaders.map((row: any) => row.user_id),
    ...reports.map((row: any) => row.reporter_id),
  ].filter(Boolean))];
  const { data: profiles } = userIds.length ? await admin.from('profiles').select('id,full_name').in('id', userIds) : { data: [] as any[] };
  const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile.full_name]));

  const metricCards = [
    { label: 'Posts', value: posts.length, icon: MessageSquare },
    { label: 'Study groups', value: groups.length, icon: Users },
    { label: 'Discussions', value: topics.length, icon: MessageSquare },
    { label: 'Open reports', value: reports.filter((r: any) => r.status === 'open').length, icon: AlertTriangle },
    { label: 'Interactions', value: (commentsResult.count ?? 0) + (likesResult.count ?? 0), icon: Trophy },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <div className="flex items-start justify-between gap-6"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Community Operations</p><h1 className="mt-2 text-3xl font-black">One community, one moderation workspace.</h1><p className="mt-2 max-w-2xl text-slate-300">Manage the live learner feed, groups, discussions, and reported content from the same canonical data source.</p></div><ShieldCheck className="h-10 w-10 text-cyan-300" /></div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{metricCards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="h-5 w-5 text-brand-blue-600" /><div className="mt-2 text-2xl font-black">{value}</div><div className="text-xs font-bold text-slate-500">{label}</div></div>)}</section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">Moderation queue</h2><p className="mt-1 text-sm text-slate-600">Learner-submitted reports remain open until an authorized operator reviews and resolves them.</p></div></div>
        <div className="mt-4 space-y-3">{reports.map((report: any) => <article key={report.id} className={`rounded-2xl border bg-white p-5 ${report.status === 'open' ? 'border-amber-300' : 'border-slate-200'}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${report.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{report.status}</span><span className="text-xs font-black uppercase text-slate-500">{report.target_type}</span><span className="text-xs text-slate-400">{new Date(report.created_at).toLocaleString()}</span></div><p className="mt-2 font-black text-slate-900">{String(report.reason).replaceAll('_', ' ')}</p>{report.details && <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.details}</p>}<p className="mt-2 text-xs text-slate-500">Reporter: {profileMap.get(report.reporter_id) || 'Learner'} · Target ID: {report.target_id}</p></div><div className="flex flex-wrap gap-2"><form action={updateReport}><input type="hidden" name="id" value={report.id} /><input type="hidden" name="status" value="reviewing" /><button className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" />Reviewing</button></form><form action={updateReport}><input type="hidden" name="id" value={report.id} /><input type="hidden" name="status" value="resolved" /><button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white"><CheckCircle2 className="h-3.5 w-3.5" />Resolve</button></form><form action={updateReport}><input type="hidden" name="id" value={report.id} /><input type="hidden" name="status" value="dismissed" /><button className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white"><XCircle className="h-3.5 w-3.5" />Dismiss</button></form></div></div></article>)}{!reports.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-2 font-bold">No open community reports.</p></div>}</div>
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section><h2 className="text-xl font-black">Recent posts</h2><div className="mt-4 space-y-3">{posts.map((post: any) => <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-black text-slate-500">{profileMap.get(post.user_id) || 'Learner'} · {new Date(post.created_at).toLocaleString()}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{post.content}</p><p className="mt-3 text-xs font-bold text-slate-500">{post.likes_count ?? 0} likes · {post.comments_count ?? 0} comments</p></div><form action={deleteCommunityItem}><input type="hidden" name="type" value="post" /><input type="hidden" name="id" value={post.id} /><button aria-label="Delete post" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></form></div></article>)}{!posts.length && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No learner posts yet.</div>}</div></section>

        <aside className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Top learners</h2><div className="mt-3 space-y-3">{leaders.map((row: any, index: number) => <div key={row.user_id} className="flex justify-between gap-3 text-sm"><span className="truncate font-semibold">{index + 1}. {profileMap.get(row.user_id) || 'Learner'}</span><strong>{row.points} pts</strong></div>)}{!leaders.length && <p className="text-sm text-slate-500">No points awarded yet.</p>}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Study groups</h2><div className="mt-3 space-y-3">{groups.slice(0, 8).map((group: any) => <div key={group.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="text-sm font-black">{group.name || 'Group'}</p><p className="text-xs text-slate-500">{group.topic || 'General'} · {group.member_count ?? 0} members</p></div><form action={deleteCommunityItem}><input type="hidden" name="type" value="group" /><input type="hidden" name="id" value={group.id} /><button aria-label="Delete group" className="text-slate-400 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></form></div>)}{!groups.length && <p className="text-sm text-slate-500">No study groups yet.</p>}</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Discussions</h2><div className="mt-3 space-y-3">{topics.slice(0, 8).map((topic: any) => <div key={topic.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="text-sm font-black">{topic.title}</p><p className="text-xs text-slate-500">{topic.reply_count ?? 0} replies</p></div><form action={deleteCommunityItem}><input type="hidden" name="type" value="topic" /><input type="hidden" name="id" value={topic.id} /><button aria-label="Delete discussion" className="text-slate-400 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></form></div>)}{!topics.length && <p className="text-sm text-slate-500">No discussions yet.</p>}</div></div></aside>
      </div>
    </main>
  );
}
