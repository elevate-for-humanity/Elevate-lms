import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Users, Clock, Plus, Pin, Lock, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ forumId: string }>;
}

interface Thread {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { forumId } = await params;
  const supabase = await createClient();
  const { data: forum } = await supabase.from('forums').select('name').eq('id', forumId).single();
  return { title: forum?.name ?? 'Forum' };
}

export default async function ForumPage({ params }: Props) {
  const { forumId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/forums/' + forumId);

  const { data: forum, error } = await supabase.from('forums').select('*').eq('id', forumId).single();
  if (error || !forum) notFound();

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('*, profiles (full_name, avatar_url)')
    .eq('forum_id', forumId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const typedThreads = (threads ?? []) as Thread[];

  const { count: memberCount } = await supabase
    .from('forum_members')
    .select('*', { count: 'exact', head: true })
    .eq('forum_id', forumId);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/lms/forums" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Forums
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{forum.name}</h1>
              {forum.description && <p className="text-slate-600 mt-2">{forum.description}</p>}
            </div>
            <Link
              href={`/lms/forums/${forumId}/new`}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              New Thread
            </Link>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /><span>{typedThreads.length} threads</span></div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{memberCount ?? 0} members</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {typedThreads.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {typedThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/lms/forums/${forumId}/threads/${thread.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
                >
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {thread.is_pinned && <Pin className="w-4 h-4 text-brand-orange-500" />}
                      {thread.is_locked && <Lock className="w-4 h-4 text-slate-400" />}
                      <h3 className="font-medium text-slate-900 truncate">{thread.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span>{thread.profiles?.full_name ?? 'Anonymous'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(thread.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No threads yet. Start the conversation!</p>
              <Link
                href={`/lms/forums/${forumId}/new`}
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create First Thread
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
