import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/success' },
  title: 'Success Stories | Elevate For Humanity',
  description: 'Manage participant success stories and testimonials.',
};

export default async function SuccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: stories, count } = await supabase.from('success_stories').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(10);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Success Stories</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Success Stories</h1><p className="text-gray-600 mt-2">{count || 0} stories published</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Story</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="divide-y">
            {stories && stories.length > 0 ? stories.map((story: any) => (
              <div key={story.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div><p className="font-medium">{story.title || story.participant_name}</p><p className="text-sm text-gray-500 mt-1 line-clamp-2">{story.summary || story.content}</p></div>
                  <span className={`px-2 py-1 rounded-full text-xs ${story.status === 'published' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-600'}`}>{story.status || 'draft'}</span>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No success stories yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
