"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { MessageSquare, ThumbsUp, Reply, Send } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
}

interface DiscussionForumProps {
  lessonId: string;
  initialComments?: Comment[];
}

export function DiscussionForum({
  lessonId,
  initialComments = [],
}: DiscussionForumProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch comments from database
  React.useEffect(() => {
    const fetchComments = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('lesson_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('lesson_id', lessonId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (data) {
        const formatted: Comment[] = data.map(c => ({
          id: c.id,
          author: (c.profiles as any)?.full_name || 'Anonymous',
          avatar: (c.profiles as any)?.avatar_url || 'AU',
          content: c.content,
          timestamp: new Date(c.created_at).toLocaleDateString(),
          likes: c.likes_count || 0,
          replies: [],
        }));
        setComments(formatted);
      }
    };
    fetchComments();
  }, [lessonId]);

  const addComment = async () => {
    if (!newComment.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('lesson_comments')
      .insert({
        lesson_id: lessonId,
        user_id: user?.id,
        content: newComment,
      })
      .select()
      .single();

    if (!error && data) {
      const comment: Comment = {
        id: data.id,
        author: user?.email?.split('@')[0] || 'Current User',
        avatar: 'CU',
        content: newComment,
        timestamp: 'Just now',
        likes: 0,
        replies: [],
      };
      setComments([comment, ...comments]);
    }
    setNewComment('');
  };

  const addReply = (commentId: string) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      avatar: 'CU',
      content: replyText,
      timestamp: 'Just now',
      likes: 0,
      replies: [],
    };

    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...comment.replies, reply],
          };
        }
        return comment;
      })
    );

    setReplyText('');
    setReplyingTo(null);
  };

  const likeComment = (commentId: string) => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, likes: comment.likes + 1 };
        }
        return comment;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* New Comment */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Start a Discussion</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ask a question or share your thoughts..."
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 min-h-[100px]"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-6 shadow-sm">
              {/* Comment Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{comment.author}</span>
                    <span className="text-sm text-slate-500">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-black">{comment.content}</p>
                </div>
              </div>

              {/* Comment Actions */}
              <div className="flex items-center gap-4 ml-14">
                <button
                  onClick={() => likeComment(comment.id)}
                  className="flex items-center gap-2 text-sm text-black hover:text-brand-blue-600 transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
                </button>
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-2 text-sm text-black hover:text-brand-blue-600 transition"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="ml-14 mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 min-h-[80px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="px-4 py-2 text-black hover:bg-slate-100 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addReply(comment.id)}
                      disabled={!replyText.trim()}
                      className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-14 mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {reply.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {reply.author}
                          </span>
                          <span className="text-xs text-slate-500">
                            {reply.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-black">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No discussions yet</h3>
            <p className="text-black">
              Be the first to start a conversation about this lesson!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
