import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/profile' },
  title: 'My Profile | Elevate For Humanity',
  description: 'Manage your learner profile and preferences.',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  const { count: completedCourses } = await db.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed');
  const { count: certificates } = await db.from('certificates').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Profile</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-brand-blue-100 rounded-full flex items-center justify-center"><span className="text-3xl text-brand-blue-600 font-bold">{(profile?.full_name || 'U')[0]}</span></div>
            <div><h2 className="text-xl font-semibold">{profile?.full_name || 'User'}</h2><p className="text-gray-500">{profile?.email || user.email}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-brand-blue-600">{completedCourses || 0}</p><p className="text-sm text-gray-500">Courses Completed</p></div>
            <div className="p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-brand-green-600">{certificates || 0}</p><p className="text-sm text-gray-500">Certificates</p></div>
            <div className="p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-brand-blue-600">0</p><p className="text-sm text-gray-500">Badges</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
          <form className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label><input type="text" className="w-full border rounded-lg px-3 py-2" defaultValue={profile?.full_name || ''} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Bio</label><textarea className="w-full border rounded-lg px-3 py-2" rows={3} defaultValue={profile?.bio || ''} placeholder="Tell us about yourself" /></div>
            <button type="submit" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
}
