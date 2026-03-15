"use client";

import React from 'react';

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, TrendingUp, Users, Pin } from "lucide-react";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  user_id: string;
  author_name: string;
  reply_count: number;
  view_count: number;
  is_pinned: boolean;
  last_reply_at: string;
  created_at: string;
}

interface ForumListProps {
  threads: ForumThread[];
  categoryId?: string;
}

export function ForumList({ threads, categoryId }: ForumListProps) {
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;

    if (sortBy === "recent") {
      return new Date(b.last_reply_at || b.created_at).getTime() -
             new Date(a.last_reply_at || a.created_at).getTime();
    } else {
      return b.reply_count - a.reply_count;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Discussions</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "recent"
                ? "bg-brand-orange-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === "popular"
                ? "bg-brand-orange-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Popular
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedThreads.map((thread) => (
          <Link
            key={thread.id}
            href={`/community/thread/${thread.id}`}
            className="block bg-slate-800 hover:bg-slate-750 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.is_pinned && (
                    <Pin className="w-4 h-4 text-brand-orange-400" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-brand-orange-400 transition-colors">
                    {thread.title}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                  {thread.content}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {thread.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {thread.reply_count} replies
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {thread.view_count} views
                  </span>
                  <span>
                    {new Date(thread.last_reply_at || thread.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {threads.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <MessageSquare className="w-12 h-12 text-black mx-auto mb-4" />
          <p className="text-slate-500">No discussions yet. Be the first to start one!</p>
        </div>
      )}
    </div>
  );
}
