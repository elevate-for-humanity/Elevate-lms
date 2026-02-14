
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, Clock, User, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Thread {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: { full_name: string; avatar_url?: string };
  reply_count: number;
  likes: number;
  pinned: boolean;
}

export default function ProgramDiscussionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [program, setProgram] = useState<any>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadData();
  }, [slug]);

  async function loadData() {
    const supabase = createClient();
    
    // Check auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
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

    // Load discussion threads - use forum_threads with course association
    // Note: program_discussions table requires migration - using existing forum system
    const { data: threadsData, error: threadsError } = await supabase
      .from('forum_threads')
      .select(`
        id,
        title,
        created_at,
        pinned,
        views,
        author_id
      `)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (threadsError) {
      console.log('Forum threads not accessible:', threadsError.message);
      setThreads([]);
      setLoading(false);
      return;
    }

    // Get reply counts from forum_posts
    const threadsWithReplies = await Promise.all(
      (threadsData || []).map(async (thread: any) => {
        const { count } = await supabase
          .from('forum_posts')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id);
        
        // Get author profile
        const { data: authorData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', thread.author_id)
          .single();
        
        return {
          ...thread,
          content: '', // forum_threads doesn't have content field
          likes: thread.views || 0,
          reply_count: count || 0,
          author: authorData || { full_name: 'Anonymous' },
        };
      })
    );

    setThreads(threadsWithReplies);
    setLoading(false);
  }

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) return;
    
    setPosting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('program_discussions')
      .insert({
        program_id: program.id,
        author_id: user.id,
        title,
        content,
      });

    if (!error) {
      setTitle('');
      setContent('');
      setShowForm(false);
      loadData();
    } else {
      alert('Failed to create discussion');
    }
    
    setPosting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: program?.title || program?.name || 'Program', href: `/programs/${slug}` },
          { label: 'Discussions' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Discussions</h1>
              <p className="text-gray-600 mt-1">{program?.title || program?.name}</p>
            </div>
            {user && isEnrolled && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Start Discussion
              </button>
            )}
          </div>
        </div>

        {/* Login/Enroll prompt */}
        {!user && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
            <p className="text-brand-blue-800">
              <Link href="/login" className="font-semibold underline">Sign in</Link> to participate in discussions.
            </p>
          </div>
        )}

        {user && !isEnrolled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <p className="text-yellow-800">
              <Link href={`/enroll/${program.id}`} className="font-semibold underline">Enroll in this program</Link> to participate in discussions.
            </p>
          </div>
        )}

        {/* New Thread Form */}
        {showForm && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Start a New Discussion</h2>
            <form onSubmit={createThread} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, questions, or experiences..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={posting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  {posting ? 'Posting...' : 'Post Discussion'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Threads List */}
        <div className="space-y-4">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/programs/${slug}/discussions/${thread.id}`}
                className="block bg-white rounded-xl border p-6 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {thread.pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pinned</span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{thread.title}</h3>
                    </div>
                    <p className="text-gray-600 mt-1 line-clamp-2">{thread.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {thread.author?.full_name || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(thread.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {thread.reply_count} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {thread.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No discussions yet</h3>
              <p className="text-gray-500 mb-6">
                Be the first to start a conversation with fellow learners!
              </p>
              {user && isEnrolled && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Start First Discussion
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
