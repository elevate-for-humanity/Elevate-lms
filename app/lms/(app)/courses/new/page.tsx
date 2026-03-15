import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/courses/new' },
  title: 'Create Course | Elevate For Humanity',
  description: 'Create a new course in the LMS.',
};

export default async function NewCoursePage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'instructor' && profile?.role !== 'admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/learner/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li><Link href="/learner/courses" className="hover:text-primary">Courses</Link></li><li>/</li><li className="text-gray-900 font-medium">New</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">Set up a new course for learners</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Enter course title" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Course description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Category</label><select className="w-full border rounded-lg px-3 py-2"><option>Select category</option><option>Technology</option><option>Business</option><option>Healthcare</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Level</label><select className="w-full border rounded-lg px-3 py-2"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label><div className="border-2 border-dashed rounded-lg p-6 text-center"><p className="text-gray-500">Drag and drop or click to upload</p></div></div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Create Course</button>
              <Link href="/learner/courses" className="px-4 py-2 border rounded-lg hover:bg-white">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
