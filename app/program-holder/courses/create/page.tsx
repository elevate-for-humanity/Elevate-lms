import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder/courses/create' },
  title: 'Create Course | Elevate For Humanity',
  description: 'Create a new course for your program.',
};

export default async function CreateCoursePage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/program-holder" className="hover:text-primary">Program Holder</Link></li><li>/</li><li><Link href="/program-holder/courses/create" className="hover:text-primary">Courses</Link></li><li>/</li><li className="text-gray-900 font-medium">Create</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">Add a course to your program offerings</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Course Title *</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Enter course title" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Course description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Duration</label><input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., 8 weeks" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Format</label><select className="w-full border rounded-lg px-3 py-2"><option>Online</option><option>In-Person</option><option>Hybrid</option></select></div>
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <button type="submit" className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Create Course</button>
              <Link href="/program-holder/courses/create" className="px-4 py-2 border rounded-lg hover:bg-white">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
