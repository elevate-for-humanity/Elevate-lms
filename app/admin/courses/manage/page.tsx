import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/courses/manage',
  },
  title: 'Manage Courses | Elevate For Humanity',
  description: 'View and manage all courses in the system.',
};

export default async function ManageCoursesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: courses, count } = await supabase
    .from('training_courses')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/courses" className="hover:text-primary">Courses</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Manage</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-gray-600 mt-2">{count || 0} courses in the system</p>
            </div>
            <Link href="/admin/courses/create" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
              Create Course
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b flex gap-4">
            <input type="text" placeholder="Search courses..." className="flex-1 border rounded-lg px-3 py-2" />
            <select className="border rounded-lg px-3 py-2">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="divide-y">
            {courses && courses.length > 0 ? (
              courses.map((course: any) => (
                <div key={course.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-gray-200 rounded" />
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-gray-500">{course.enrollment_count || 0} enrolled • {course.duration || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${course.status === 'published' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {course.status || 'draft'}
                    </span>
                    <Link href={`/admin/courses/${course.id}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">Edit</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No courses found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
