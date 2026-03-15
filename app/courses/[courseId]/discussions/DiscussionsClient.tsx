"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Reply = {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  author_name?: string;
};

type Thread = {
  id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
  replies: Reply[];
  author_name?: string;
  likes?: number;
};

export default function DiscussionsClient({
  courseId,
  initialThreads,
  currentUserId,
}: {
  courseId: string;
  initialThreads: Thread[];
  currentUserId: string;
}) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

  // Real-time updates
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel('discussions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'discussion_threads',
        filter: `course_id=eq.${courseId}`,
      }, () => {
        // Refresh threads on changes
        refreshThreads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  async function refreshThreads() {
    const res = await fetch(`/api/discussions/threads?courseId=${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
    }
  }

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !body) return;
    setPosting(true);

    const res = await fetch('/api/discussions/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, title, body }),
    });
    const data = await res.json();
    setPosting(false);

    if (!res.ok) {
      alert(data.error || 'Unable to post thread');
      return;
    }

    setThreads((prev) => [data.thread, ...prev]);
    setTitle('');
    setBody('');
  }

  async function createReply(threadId: string) {
    if (!replyBody.trim()) return;

    const res = await fetch('/api/discussions/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, body: replyBody }),
    });

    if (res.ok) {
      const data = await res.json();
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, replies: [...t.replies, data.reply] }
            : t
        )
      );
      setReplyBody('');
      setReplyingTo(null);
    }
  }

  async function likeThread(threadId: string) {
    await fetch('/api/discussions/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
    refreshThreads();
  }

  const filteredThreads = threads
    .filter((t) =>
      searchQuery === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.likes || 0) - (a.likes || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-black">
            Course Discussions
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-2 text-sm rounded-lg ${
                sortBy === 'recent'
                  ? 'bg-brand-orange-500 text-white'
                  : 'bg-white text-black border border-slate-200'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-2 text-sm rounded-lg ${
                sortBy === 'popular'
                  ? 'bg-brand-orange-500 text-white'
                  : 'bg-white text-black border border-slate-200'
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search discussions..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
          className="w-full mb-4 rounded-lg border border-slate-200 px-4 py-2 text-sm"
        />

        <form
          onSubmit={createThread}
          className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm"
        >
          <p className="text-xs font-semibold text-black">
            Start a new topic
          </p>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Short topic title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setTitle(e.target.value)}
          />
          <textarea
            className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ask a question or start a discussion…"
            value={body}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setBody(e.target.value)}
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-2xl bg-brand-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post'}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {filteredThreads.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-sm font-semibold text-black">
                  {t.title}
                </h2>
              </div>
              <p className="mt-1 text-sm text-black">{t.body}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                Posted {new Date(t.created_at).toLocaleString()}
              </p>
            </article>
          ))}
          {threads.length === 0 && (
            <p className="text-sm text-slate-500">
              No discussions yet. Be the first to post.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
