export const dynamic = 'force-dynamic';

'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Send, ThumbsUp, User, Clock, MessageSquare } from 'lucide-react';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  author: { full_name: string; avatar_url?: string };
  likes: number;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { full_name: string; avatar_url?: string };
  likes: number;
  pinned: boolean;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const threadId = params.threadId as string;
  
  const [program, setProgram] = useState<any>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadData();
  }, [slug, threadId]);

  async function loadData() {
    const supabase = createClient();
    
    // Check auth
    const { data: { user: authUser } } = await supabase?.auth.getUser();
    setUser(authUser);

    // Load program by slug
    const { data: programData } = await supabase
      .from('programs')
      .select('id, title, name, slug')
      .eq('slug', slug)
      .single();

    if (!programData) {
      router.push('/programs');
      return;
    }

    setProgram(programData);

    // Check if user is enrolled
    if (authUser) {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', programData.id)
        .eq('user_id', authUser.id);
      
      setIsEnrolled((count || 0) > 0);
    }

    // Load thread
    const { data: threadData } = await supabase
      .from('program_discussions')
      .select(`
        id,
        title,
        content,
        created_at,
        pinned,
        likes,
        author:profiles!author_id(full_name, avatar_url)
      `)
      .eq('id', threadId)
      .single();

    if (!threadData) {
      router.push(`/programs/${slug}/discussions`);
      return;
    }

    setThread(threadData);

    // Load replies
    const { data: repliesData } = await supabase
      .from('program_discussion_replies')
      .select(`
        id,
        content,
        created_at,
        likes,
        author:profiles!author_id(full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    setReplies(repliesData || []);
    setLoading(false);
  }

  async function postReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;
    
    setPosting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('program_discussion_replies')
      .insert({
        thread_id: threadId,
        author_id: user.id,
        content: replyContent,
      });

    if (!error) {
      setReplyContent('');
      loadData();
    } else {
      alert('Failed to post reply');
    }
    
    setPosting(false);
  }

  async function likeThread() {
    if (!user) return;
    const supabase = createClient();
    
    await supabase
      .from('program_discussions')
      .update({ likes: (thread?.likes || 0) + 1 })
      .eq('id', threadId);
    
    loadData();
  }

  async function likeReply(replyId: string, currentLikes: number) {
    if (!user) return;
    const supabase = createClient();
    
    await supabase
      .from('program_discussion_replies')
      .update({ likes: currentLikes + 1 })
      .eq('id', replyId);
    
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!thread) return null;

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Programs", href: "/programs" }, { label: "[Threadid]" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/programs/${slug}/discussions`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discussions
          </Link>
        </div>

        {/* Thread */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {thread.pinned && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pinned</span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{thread.author?.full_name || 'Anonymous'}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(thread.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{thread.content}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <button
                  onClick={likeThread}
                  disabled={!user}
                  className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition disabled:opacity-50"
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span>{thread.likes || 0}</span>
                </button>
                <span className="flex items-center gap-2 text-gray-500">
                  <MessageSquare className="w-5 h-5" />
                  <span>{replies.length} replies</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Replies ({replies.length})</h2>
          
          {replies.map((reply) => (
            <div key={reply.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span className="font-medium text-gray-900">{reply.author?.full_name || 'Anonymous'}</span>
                    <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  <button
                    onClick={() => likeReply(reply.id, reply.likes || 0)}
                    disabled={!user}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition mt-3 disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{reply.likes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {replies.length === 0 && (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No replies yet. Be the first to respond!</p>
            </div>
          )}
        </div>

        {/* Reply Form */}
        {user && isEnrolled ? (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add a Reply</h3>
            <form onSubmit={postReply} className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={posting}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {posting ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border p-6 text-center">
            {!user ? (
              <p className="text-gray-600">
                <Link href="/login" className="text-blue-600 font-semibold">Sign in</Link> to reply to this discussion.
              </p>
            ) : (
              <p className="text-gray-600">
                <Link href={`/enroll/${program?.id}`} className="text-blue-600 font-semibold">Enroll in this program</Link> to participate in discussions.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
