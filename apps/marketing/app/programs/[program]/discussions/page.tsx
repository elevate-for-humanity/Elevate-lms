'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Clock, MessageSquare, Plus, ThumbsUp, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { full_name: string | null; avatar_url?: string | null } | null;
  reply_count: number;
  likes: number;
  pinned: boolean;
}

export default function ProgramDiscussionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.program ?? '');
  const [program, setProgram] = useState<{ id: string; title?: string | null; name?: string | null } | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data: programData } = await supabase.from('programs').select('id, title, name').eq('slug', slug).maybeSingle();
    if (!programData) {
      router.replace('/programs');
      return;
    }
    setProgram(programData);

    if (user) {
      const { count } = await supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', programData.id).eq('user_id', user.id);
      setIsEnrolled((count ?? 0) > 0);
    } else {
      setIsEnrolled(false);
    }

    const { data: threadRows, error } = await supabase.from('forum_threads').select('id, title, created_at, pinned, views, author_id').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(20);
    if (error) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const rows = await Promise.all((threadRows ?? []).map(async (thread) => {
      const [{ count }, { data: author }] = await Promise.all([
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('thread_id', thread.id),
        supabase.from('profiles').select('full_name, avatar_url').eq('id', thread.author_id).maybeSingle(),
      ]);
      return {
        id: thread.id,
        title: thread.title,
        content: '',
        created_at: thread.created_at,
        pinned: Boolean(thread.pinned),
        likes: Number(thread.views ?? 0),
        reply_count: count ?? 0,
        author: author ?? { full_name: 'Anonymous', avatar_url: null },
      } satisfies Thread;
    }));

    setThreads(rows);
    setLoading(false);
  }, [router, slug]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function createThread(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !userId || !program) return;
    setPosting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('program_discussions').insert({
        program_id: program.id,
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
      });
      if (error) throw error;
      setTitle('');
      setContent('');
      setShowForm(false);
      await loadData();
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-blue-600 border-t-transparent" /></main>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: program?.title || program?.name || 'Program', href: `/programs/${slug}` }, { label: 'Discussions' }]} />
        <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Community Discussions</h1><p className="mt-1 text-slate-600">{program?.title || program?.name}</p></div>{userId && isEnrolled ? <button type="button" onClick={() => setShowForm(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue-700 px-5 font-black text-white"><Plus className="h-4 w-4" />Start discussion</button> : null}</div>

        {!userId ? <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5"><Link href="/login" className="font-black text-brand-blue-700">Sign in</Link> to participate in discussions.</div> : null}
        {userId && !isEnrolled ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5"><Link href={`/programs/${slug}/apply`} className="font-black text-amber-900">Enroll in this program</Link> to participate in discussions.</div> : null}

        {showForm ? <form onSubmit={createThread} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Start a new discussion</h2><label className="mt-4 block text-sm font-bold">Topic title<input value={title} onChange={(event) => setTitle(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label><label className="mt-4 block text-sm font-bold">Message<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} required className="mt-2 w-full rounded-xl border border-slate-300 p-3" /></label><div className="mt-4 flex gap-3"><button type="submit" disabled={posting} className="rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white disabled:opacity-50">{posting ? 'Posting…' : 'Post discussion'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-3 font-bold">Cancel</button></div></form> : null}

        <section className="mt-7 space-y-4">{threads.length ? threads.map((thread) => <Link key={thread.id} href={`/programs/${slug}/discussions/${thread.id}`} className="block rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50"><User className="h-5 w-5 text-blue-700" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2">{thread.pinned ? <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Pinned</span> : null}<h2 className="truncate text-lg font-black">{thread.title}</h2></div><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><User className="h-4 w-4" />{thread.author?.full_name ?? 'Anonymous'}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(thread.created_at).toLocaleDateString()}</span><span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{thread.reply_count} replies</span><span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" />{thread.likes}</span></div></div></div></Link>) : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><MessageSquare className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-3 font-black">No discussions yet</h2><p className="mt-1 text-sm text-slate-600">Start the first conversation when you are enrolled.</p></div>}</section>
      </div>
    </main>
  );
}
