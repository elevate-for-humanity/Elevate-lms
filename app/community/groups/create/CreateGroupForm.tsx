'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, Globe, Lock } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  userId: string;
  userName: string;
  programs: Program[];
}

export default function CreateGroupForm({ userId, userName, programs }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    programId: '',
    meetingSchedule: '',
    maxMembers: '10',
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create the study group
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name: formData.name,
          description: formData.description,
          program_id: formData.programId || null,
          meeting_schedule: formData.meetingSchedule,
          max_members: parseInt(formData.maxMembers) || 10,
          is_private: formData.isPrivate,
          created_by: userId,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as first member
      await supabase
        .from('study_group_members')
        .insert({
          group_id: group.id,
          user_id: userId,
          role: 'admin',
        });

      // Create a discussion post for the group
      await supabase
        .from('discussions')
        .insert({
          title: `Study Group: ${formData.name}`,
          content: formData.description || `Join our study group! ${formData.meetingSchedule ? `We meet ${formData.meetingSchedule}.` : ''}`,
          category: 'study-groups',
          author_id: userId,
          study_group_id: group.id,
        });

      router.push(`/community/groups/${group.id}`);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6">
      {error && (
        <div className="mb-4 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
          <input type="text" value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500"
            placeholder="e.g., CNA Exam Prep Group" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500"
            placeholder="What will your group focus on? What are your goals?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Related Program</label>
          <select value={formData.programId}
            onChange={e => setFormData({ ...formData, programId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="">Select a program (optional)</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Schedule</label>
          <input type="text" value={formData.meetingSchedule}
            onChange={e => setFormData({ ...formData, meetingSchedule: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500"
            placeholder="e.g., Tuesdays and Thursdays at 7 PM EST" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Members</label>
          <select value={formData.maxMembers}
            onChange={e => setFormData({ ...formData, maxMembers: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500">
            <option value="5">5 members</option>
            <option value="10">10 members</option>
            <option value="15">15 members</option>
            <option value="20">20 members</option>
            <option value="50">50 members</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
          <div className="flex gap-4">
            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
              !formData.isPrivate ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:bg-gray-50'
            }`}>
              <input type="radio" name="visibility" checked={!formData.isPrivate}
                onChange={() => setFormData({ ...formData, isPrivate: false })}
                className="w-4 h-4 text-brand-orange-500" />
              <Globe className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Public</p>
                <p className="text-sm text-gray-500">Anyone can find and join</p>
              </div>
            </label>
            <label className={`flex-1 flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${
              formData.isPrivate ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:bg-gray-50'
            }`}>
              <input type="radio" name="visibility" checked={formData.isPrivate}
                onChange={() => setFormData({ ...formData, isPrivate: true })}
                className="w-4 h-4 text-brand-orange-500" />
              <Lock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Private</p>
                <p className="text-sm text-gray-500">Invite only</p>
              </div>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button type="submit" disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50">
            <Users className="w-5 h-5" />
            {isSubmitting ? 'Creating...' : 'Create Study Group'}
          </button>
        </div>
      </div>
    </form>
  );
}
