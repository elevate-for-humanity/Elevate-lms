import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Lessons Management | Admin',
  description: 'Manage course lessons and content',
};

export default async function LessonsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: lessons, count: totalLessons } = await supabase
    .from('lessons')
    .select('id, title, course_id, order_index, duration, video_url, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .limit(100);

  // Get courses for display names
  const courseIds = [...new Set((lessons || []).map(l => l.course_id).filter(Boolean))];
  const { data: courses } = courseIds.length > 0
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [] };

  const courseMap = new Map((courses || []).map(c => [c.id, c.title]));

  const { count: withVideo } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .not('video_url', 'is', null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Lessons' }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Lessons Management</h1>
              <p className="text-black mt-1">Manage course lessons and content across all courses</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Total Lessons</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalLessons || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">With Video</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">{withVideo || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Courses</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">{courseIds.length}</p>
            </div>
          </div>
        </div>

        {/* Lessons Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(lessons || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No lessons found. Create lessons from the{' '}
                      <Link href="/admin/course-builder" className="text-brand-blue-600 hover:underline">Course Builder</Link>.
                    </td>
                  </tr>
                ) : (
                  (lessons || []).map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lesson.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-400 font-mono">{lesson.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lesson.course_id ? (
                          <Link href={`/admin/courses/${lesson.course_id}/content`} className="text-brand-blue-600 hover:underline">
                            {courseMap.get(lesson.course_id) || lesson.course_id.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lesson.order_index ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{lesson.duration || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {lesson.video_url ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {lesson.course_id && (
                          <Link
                            href={`/admin/courses/${lesson.course_id}/content`}
                            className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                          >
                            Edit in Course
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
