"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
}

interface StudyGroup {
  id: string;
  name: string;
  members: number;
  topic: string;
  nextSession: string;
}

export function SocialLearningCommunity() {
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'discussions'>('feed');
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [dbGroups, setDbGroups] = useState<StudyGroup[]>([]);
  const supabase = createClient();

  // Load community data from DB
  useEffect(() => {
    async function loadCommunityData() {
      // Load posts
      const { data: posts } = await supabase
        .from('community_posts')
        .select(`
          id, content, created_at, likes_count, comments_count, tags,
          profiles:user_id (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (posts) {
        setDbPosts(posts.map((p: any) => ({
          id: p.id,
          author: p.profiles?.full_name || 'Anonymous',
          avatar: p.profiles?.avatar_url || '👤',
          content: p.content,
          timestamp: p.created_at,
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          tags: p.tags || []
        })));
      }

      // Load study groups
      const { data: groups } = await supabase
        .from('study_groups')
        .select('id, name, topic, next_session, study_group_members (count)')
        .limit(10);

      if (groups) {
        setDbGroups(groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          members: g.study_group_members?.[0]?.count || 0,
          topic: g.topic,
          nextSession: g.next_session
        })));
      }
    }
    loadCommunityData();
  }, [supabase]);

  const posts: Post[] = [
    {
      id: '1',
      author: 'Sarah Chen',
      avatar: '👩‍💻',
      content: 'Just completed the React Hooks module! The useEffect cleanup pattern finally clicked for me. Anyone else struggled with this?',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      tags: ['React', 'JavaScript'],
    },
    {
      id: '2',
      author: 'Graduate',
      avatar: '👨‍🎓',
      content: 'Looking for study partners for the upcoming Node.js certification exam. Planning to meet virtually every Tuesday evening.',
      timestamp: '5 hours ago',
      likes: 15,
      comments: 12,
      tags: ['Node.js', 'Study Group'],
    },
    {
      id: '3',
      author: 'Emily Rodriguez',
      avatar: '👩‍🔬',
      timestamp: '1 day ago',
      likes: 42,
      comments: 6,
      tags: ['JavaScript', 'Tips'],
    },
  ];

  const studyGroups: StudyGroup[] = [
    {
      id: '1',
      name: 'React Mastery',
      members: 45,
      topic: 'Advanced React Patterns',
      nextSession: 'Tomorrow, 6:00 PM',
    },
    {
      id: '2',
      name: 'JavaScript Deep Dive',
      members: 32,
      topic: 'Closures & Scope',
      nextSession: 'Friday, 7:00 PM',
    },
    {
      id: '3',
      name: 'Full-Stack Builders',
      members: 28,
      topic: 'Project Showcase',
      nextSession: 'Saturday, 2:00 PM',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="   text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2 text-2xl md:text-3xl lg:text-4xl">Learning Community</h1>
          <p className="text-red-100">Connect, collaborate, and learn together</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {(['feed', 'groups', 'discussions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium capitalize ${
                  activeTab === tab ? 'border-red-600 text-brand-orange-600' : 'border-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={3}
                  placeholder="Share your learning journey, ask questions, or help others..."
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    <button className="px-3 py-2 text-sm text-black hover:bg-gray-100 rounded">
                      📷 Image
                    </button>
                    <button className="px-3 py-2 text-sm text-black hover:bg-gray-100 rounded">
                      💻 Code
                    </button>
                    <button className="px-3 py-2 text-sm text-black hover:bg-gray-100 rounded">
                      🏷️ Tag
                    </button>
                  </div>
                  <Button size="sm">Post</Button>
                </div>
              </Card>

              {posts.map((post) => (
                <Card key={post.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="text-3xl">{post.avatar}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{post.author}</h4>
                          <p className="text-sm text-gray-500">{post.timestamp}</p>
                        </div>
                      </div>
                      <p className="text-black mb-3">{post.content}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-2 py-2 bg-orange-100 text-orange-700 text-xs rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-sm text-black">
                        <button className="hover:text-brand-orange-600">❤️ {post.likes}</button>
                        <button className="hover:text-brand-blue-600">💬 {post.comments}</button>
                        <button className="hover:text-green-600">🔗 Share</button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Trending Topics</h3>
                <div className="space-y-2">
                  {['#React', '#JavaScript', '#WebDevelopment', '#NodeJS', '#TypeScript'].map((tag) => (
                    <div key={tag} className="flex justify-between items-center">
                      <span className="text-brand-blue-600 hover:underline cursor-pointer">{tag}</span>
                      <span className="text-sm text-gray-500">245 posts</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Suggested Connections</h3>
                <div className="space-y-3">
                  {['Alex Kim', 'Jordan Lee', 'Taylor Smith'].map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl">👤</div>
                        <div>
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-gray-500">Full-Stack Developer</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">Follow</Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Study Groups</h2>
              <Button>Create Group</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => (
                <Card key={group.id} className="p-6">
                  <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                  <p className="text-black text-sm mb-4">{group.topic}</p>
                  <div className="space-y-2 text-sm text-black mb-4">
                    <p>👥 {group.members} members</p>
                    <p>📅 Next: {group.nextSession}</p>
                  </div>
                  <Button className="w-full" size="sm">Join Group</Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Discussion Forums</h2>
              <Button>New Discussion</Button>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">How to handle state in large React apps?</h3>
              <p className="text-sm text-black mb-3">Posted by Alex Chen • 24 replies • Last activity 1 hour ago</p>
              <div className="flex gap-2">
                <span className="px-2 py-2 bg-brand-blue-100 text-brand-blue-700 text-xs rounded">#React</span>
                <span className="px-2 py-2 bg-purple-100 text-purple-700 text-xs rounded">#StateManagement</span>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Best practices for API error handling</h3>
              <p className="text-sm text-black mb-3">Posted by Sarah Lee • 18 replies • Last activity 3 hours ago</p>
              <div className="flex gap-2">
                <span className="px-2 py-2 bg-green-100 text-green-700 text-xs rounded">#Backend</span>
                <span className="px-2 py-2 bg-orange-100 text-orange-700 text-xs rounded">#BestPractices</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
