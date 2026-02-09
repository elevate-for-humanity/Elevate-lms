"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Plus, MessageCircle, Calendar, Lock, Globe } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  course: string;
  members: number;
  maxMembers: number;
  privacy: 'public' | 'private';
  nextMeeting?: string;
  avatar: string;
}

const MOCK_GROUPS: StudyGroup[] = [
    {
      id: '1',
      name: 'CNA Study Squad',
      description: 'Preparing for state certification exam together',
      course: 'Certified Nursing Assistant',
      members: 8,
      maxMembers: 12,
      privacy: 'public',
      nextMeeting: '2024-03-20 at 7:00 PM',
      avatar: '/media/groups/group-1.jpg',
    },
    {
      id: '2',
      name: 'HVAC Masters',
      description: 'Advanced troubleshooting and real-world scenarios',
      course: 'HVAC Technician',
      members: 6,
      maxMembers: 10,
      privacy: 'public',
      nextMeeting: '2024-03-21 at 6:30 PM',
      avatar: '/media/groups/group-2.jpg',
    },
    {
      id: '3',
      name: 'Weekend Warriors',
      description: 'Study group for working professionals',
      course: 'Web Development',
      members: 10,
      maxMembers: 15,
      privacy: 'private',
      avatar: '/media/groups/group-3.jpg',
    },
  ];

export function StudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>(MOCK_GROUPS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const supabase = createClient();

  // Load study groups from DB
  useEffect(() => {
    async function loadStudyGroups() {
      const { data: { user } } = await supabase.auth.getUser();

      // Load all public groups and user's private groups
      const { data } = await supabase
        .from('study_groups')
        .select(`
          id, name, description, course, max_members, privacy, next_meeting, avatar_url,
          study_group_members (count)
        `)
        .or(`privacy.eq.public,created_by.eq.${user?.id}`);

      if (data && data.length > 0) {
        setGroups(data.map((g: any) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          course: g.course,
          members: g.study_group_members?.[0]?.count || 0,
          maxMembers: g.max_members,
          privacy: g.privacy,
          nextMeeting: g.next_meeting,
          avatar: g.avatar_url || '/media/groups/default.jpg'
        })));
      }
    }
    loadStudyGroups();
  }, [supabase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Study Groups</h2>
          <p className="text-black">Connect with peers and learn together</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-orange-600 hover:bg-brand-orange-700"
        >
          <Plus size={20} className="mr-2" />
          Create Group
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition">
            <div className="relative h-32   ">
              <div className="absolute top-4 right-4">
                {group.privacy === 'public' ? (
                  <Globe className="text-white" size={20} />
                ) : (
                  <Lock className="text-white" size={20} />
                )}
              </div>
            </div>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">{group.name}</h3>
              <p className="text-sm text-black mb-3">{group.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-gray-400" />
                  <span>
                    {group.members}/{group.maxMembers} members
                  </span>
                </div>
                {group.nextMeeting && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{group.nextMeeting}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-brand-orange-600 hover:bg-brand-orange-700">
                  Join Group
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create Study Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  placeholder="What's this group about?"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Course</label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                  <option>Select a course</option>
                  <option>Certified Nursing Assistant</option>
                  <option>HVAC Technician</option>
                  <option>Web Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Privacy</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="privacy" value="public"
defaultChecked />
                    <span>Public</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="privacy" value="private" />
                    <span>Private</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button className="flex-1 bg-brand-orange-600 hover:bg-brand-orange-700">
                  Create Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
