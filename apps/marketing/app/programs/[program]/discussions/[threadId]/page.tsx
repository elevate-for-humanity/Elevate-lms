'use client';
export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MessageSquare, Send, ThumbsUp, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';

type Author = { full_name: string | null; avatar_url?: string | null };
interface Reply { id: string; content: string; created_at: string; author: Author | null; likes: number | null; }
interface Thread { id: string; title: string; content: string; created_at: string; author: Author | null; likes: number | null; pinned: boolean | null; }

function firstAuthor(value: Author | Author[] | null | undefined): Author | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params.program ?? '');
  const threadId = String(params.threadId ?? '');
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const { data: programData } = await supabase.from('programs').select('id').eq('slug', slug).maybeSingle();
    if (!programData) {
      router.replace('/programs');
      return;
    }

    if (user) {
      const { count } = await supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', programData.id).eq('user_id', user.id);
      setIsEnrolled((count ?? 0) > 0);
    } else {
      setIsEnrolled(false);
    }

    const { data: threadData } = await supabase.from('program_discussions').select(`
      id, title, content, created_at, pinned, likes,
      author:profiles!author_id(full_name, avatar_url)
    `).eq('id', threadId).maybeSingle();

    if (!threadData) {
      router.replace(`/programs/${slug}/discussions`);
      return;
    }

    setThread({
      id: threadData.id,
      title: threadData.title,
      content: threadData.content,
      created_at: threadData.created_at,
      pinned: threadData.pinned,
      likes: threadData.likes,
      author: firstAuthor(threadData.author as Author | Author[] | null),
    });

    const { data: replyRows } = await supabase.from('program_discussion_replies').select(`
      id, content, created_at, likes,
      author:profiles!author_id(full_name, avatar_url)
    `).eq('thread_id', threadId).order('created_at', { ascending: true });

    setReplies((replyRows ?? []).map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      likes: row.likes,
      author: firstAuthor(row.author as Author | Author[] | null),
    })));
    setLoading(false);
  }, [router, slug, threadId]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function postReply(event: React.FormEvent) {
    event.preventDefault();
    if (!replyContent.trim() || !userId) return;
    setPosting(true);
    try {
      const response = await fetch('/api/discussions/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content: replyContent.trim() }),
      });
      if (!response.ok) throw new Error('Reply failed');
      setReplyContent('');
      await loadData();
    } finally {
      setPosting(false);
    }
  }

  async function likeThread() {
    if (!userId) return;
    await fetch('/api/discussions/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadId }) });
    await loadData();
  }

  async function likeReply(replyId: string, currentLikes: number) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from('program_discussion_replies').update({ likes: currentLikes + 1 }).eq('id', replyId);
    await loadData();
  }

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-blue-600 border-t-transparent" /></main>;
  if (!thread) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Discussions', href: `/programs/${slug}/discussions` }, { label: thread.title }]} />
        <Link href={`/programs/${slug}/discussions`} className="mt-6 inline-flex items-center gap-2 font-bold text-brand-blue-700"><ArrowLeft className="h-4 w-4" /> Back to discussions</Link>

        <article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50"><User className="h-5 w-5 text-blue-700" /></div><div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">{thread.pinned ? <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Pinned</span> : null}<h1 className="text-2xl font-black text-slate-950">{thread.title}</h1></div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600"><span>{thread.author?.full_name ?? 'Anonymous'}</span><span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(thread.created_at).toLocaleDateString()}</span></div>
            <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-800">{thread.content}</p>
            <div className="mt-5 flex gap-5 border-t pt-4"><button type="button" onClick={() => void likeThread()} disabled={!userId} className="flex items-center gap-2 font-bold text-slate-700 disabled:opacity-50"><ThumbsUp className="h-4 w-4" />{thread.likes ?? 0}</button><span className="flex items-center gap-2 text-slate-600"><MessageSquare className="h-4 w-4" />{replies.length} replies</span></div>
          </div></div>
        </article>

        <section className="mt-7"><h2 className="text-xl font-black">Replies ({replies.length})</h2><div className="mt-4 space-y-4">{replies.map((reply) => <article key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex gap-3"><User className="mt-1 h-5 w-5 shrink-0 text-slate-500" /><div className="flex-1"><div className="flex flex-wrap gap-3 text-sm"><strong>{reply.author?.full_name ?? 'Anonymous'}</strong><span className="text-slate-500">{new Date(reply.created_at).toLocaleDateString()}</span></div><p className="mt-3 whitespace-pre-wrap text-slate-800">{reply.content}</p><button type="button" disabled={!userId} onClick={() => void likeReply(reply.id, reply.likes ?? 0)} className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600 disabled:opacity-50"><ThumbsUp className="h-4 w-4" />{reply.likes ?? 0}</button></div></div></article>)}</div></section>

        {userId && isEnrolled ? <form onSubmit={postReply} className="mt-7 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-black">Add a reply</h2><textarea value={replyContent} onChange={(event) => setReplyContent(event.target.value)} required rows={4} className="mt-4 w-full rounded-xl border border-slate-300 p-3" placeholder="Share your thoughts…" /><button type="submit" disabled={posting} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue-700 px-5 font-black text-white disabled:opacity-50"><Send className="h-4 w-4" />{posting ? 'Posting…' : 'Post reply'}</button></form> : <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-700">{userId ? 'You must be enrolled in this program to reply.' : <><Link href="/login" className="font-black text-brand-blue-700">Sign in</Link> to participate.</>}</div>}
      </div>
    </main>
  );
}
