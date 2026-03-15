import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, MessageSquare, UserPlus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Members | Elevate Hub',
  description: 'Connect with fellow learners in the community.',
};

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/members');

  // Fetch members
  const { data: members, count } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, role, bio, created_at, points', { count: 'exact' })
    .order('points', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Members</h1>
            <p className="text-slate-600 mt-1">{count?.toLocaleString() || 0} community members</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-white">
              <Filter className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members?.map((member: any) => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {member.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{member.full_name || 'Member'}</h3>
                  <p className="text-sm text-slate-500 capitalize">{member.role || 'Student'}</p>
                  {member.bio && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-sm text-slate-500">
                  {member.points || 0} points
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-500 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-500 hover:text-brand-green-600 hover:bg-brand-green-50 rounded-lg transition">
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {members && members.length >= 50 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-white">
              Load More Members
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
