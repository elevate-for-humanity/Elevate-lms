import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Plus, Search, MessageSquare, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Study Groups | Elevate For Humanity',
  description: 'Join study groups to collaborate with fellow learners.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/groups',
  },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface StudyGroup {
  id: string;
  name: string;
  category: string;
  member_count: number;
  is_active: boolean;
}

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/groups');

  // Fetch study groups from database
  const { data: groups, error } = await supabase
    .from('study_groups')
    .select('id, name, category, member_count, is_active')
    .order('member_count', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Study Groups' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-brand-blue-600" /> Study Groups
          </h1>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search groups..." className="pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" /> Create Group
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-500" />
            <p className="text-brand-red-700">Unable to load study groups. Please try again later.</p>
          </div>
        )}

        {!error && (!groups || groups.length === 0) ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Study Groups Yet</h2>
            <p className="text-gray-500 mb-6">Be the first to create a study group for your program!</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" /> Create First Group
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {groups?.map((group: StudyGroup) => (
              <div key={group.id} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-gray-500 text-sm">{group.category}</p>
                  </div>
                  {group.is_active && <span className="px-2 py-1 bg-brand-green-100 text-brand-green-700 text-xs rounded-full">Active</span>}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {group.member_count} members</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Chat</span>
                </div>
                <button className="w-full py-2 border rounded-lg text-brand-blue-600 hover:bg-brand-blue-50">Join Group</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
