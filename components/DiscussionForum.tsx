
"use client";

import React from 'react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MessageSquare, ThumbsUp, Reply } from 'lucide-react';

interface ForumPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
}

interface DiscussionForumProps {
  courseId: string;
  posts?: ForumPost[];
}

export function DiscussionForum({
  courseId,
  posts = [],
}: DiscussionForumProps) {
  const [newPost, setNewPost] = useState('');
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(posts);

  const handleSubmit = () => {
    if (!newPost.trim()) return;

    const post: ForumPost = {
      id: Date.now().toString(),
      author: 'Current User',
      avatar: '/images/split/piece-15.webp',
      content: newPost,
      timestamp: 'Just now',
      likes: 0,
      replies: 0,
    };

    setForumPosts([post, ...forumPosts]);
    setNewPost('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Start a Discussion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={newPost}
            onChange={(
              e: React.ChangeEvent<
                HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
              >
            ) => setNewPost(e.target.value)}
            placeholder="Share your thoughts, ask a question, or start a discussion..."
            className="w-full p-4 border rounded-lg min-h-[120px] focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              className="bg-brand-blue-600 hover:bg-brand-blue-700"
            >
              <MessageSquare size={16} className="mr-2" />
              Post Discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {forumPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Image
                  src={post.avatar}
                  alt={post.author}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{post.author}</h4>
                      <p className="text-sm text-gray-500">{post.timestamp}</p>
                    </div>
                  </div>
                  <p className="text-black mb-4">{post.content}</p>
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-black hover:text-brand-blue-600 transition">
                      <ThumbsUp size={16} />
                      <span className="text-sm">{post.likes} Likes</span>
                    </button>
                    <button className="flex items-center gap-2 text-black hover:text-brand-blue-600 transition">
                      <Reply size={16} />
                      <span className="text-sm">{post.replies} Replies</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
