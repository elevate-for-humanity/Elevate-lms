'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Megaphone, Send, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Announcement = { id: string; title: string; content: string; created_at: string; author?: { full_name: string | null } | null };

type Program = { id: string; title?: string | null; name?: string | null };

export default function InstructorProgramAnnouncementsPage() {
  const params = useParams();
  const router = useRouter();
  const programId = String(params.programId || '');
  const [program, setProgram] = useState<Program | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const [{ data: programData }, { data: announcementRows }, { count }] = await Promise.all([
      supabase.from('programs').select('id,title,name').eq('id', programId).maybeSingle(),
      supabase.from('program_announcements').select('id,title,content,created_at,author:profiles!author_id(full_name)').eq('program_id', programId).order('created_at', { ascending: false }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', programId),
    ]);

    if (!programData) {
      router.push('/instructor/programs');
      return;
    }
    setProgram(programData);
    setAnnouncements((announcementRows ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      author: Array.isArray(row.author) ? row.author[0] ?? null : row.author ?? null,
    })));
    setEnrolledCount(count ?? 0);
    setLoading(false);
  }, [programId, router]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function postAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      const { error: insertError } = await supabase.from('program_announcements').insert({ program_id: programId, author_id: user.id, title: title.trim(), content: content.trim() });
      if (insertError) throw insertError;
      setTitle(''); setContent(''); setShowForm(false);
      await loadData();
    } catch {
      setError('Could not post the announcement.');
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <div className="flex min-h-[360px] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue-600" /></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Breadcrumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Programs', href: '/instructor/programs' }, { label: 'Announcements' }]} />
        <Link href="/instructor/programs" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700"><ArrowLeft className="h-4 w-4" />Back to programs</Link>

        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-6 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-blue-100">Instructor communication</p><h1 className="mt-2 text-3xl font-black">Program Announcements</h1><p className="mt-1 text-blue-100">{program?.title || program?.name || 'Program'}</p></div><button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-indigo-800"><Megaphone className="h-4 w-4" />New announcement</button></div>
        </section>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><Bell className="h-5 w-5 text-brand-blue-700" /><p className="mt-2 text-2xl font-black text-slate-950">{announcements.length}</p><p className="text-xs font-bold text-slate-500">Announcements</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><Users className="h-5 w-5 text-emerald-700" /><p className="mt-2 text-2xl font-black text-slate-950">{enrolledCount}</p><p className="text-xs font-bold text-slate-500">Students in program</p></div>
        </div>

        {showForm && <form onSubmit={postAnnouncement} className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-950">Post announcement</h2><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Announcement title" required /><textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="Message to students" required />{error && <p className="text-sm font-bold text-rose-700">{error}</p>}<div className="flex gap-3"><button disabled={posting} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50"><Send className="h-4 w-4" />{posting ? 'Posting…' : 'Post to students'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Cancel</button></div></form>}

        <section className="mt-5 space-y-3">
          {announcements.length ? announcements.map((announcement) => <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-black text-slate-950">{announcement.title}</h2><span className="text-xs font-bold text-slate-500">{new Date(announcement.created_at).toLocaleDateString()}</span></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{announcement.content}</p><p className="mt-4 text-xs font-bold text-slate-500">Posted by {announcement.author?.full_name || 'Instructor'}</p></article>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Megaphone className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-bold text-slate-700">No announcements yet.</p></div>}
        </section>
      </div>
    </main>
  );
}
