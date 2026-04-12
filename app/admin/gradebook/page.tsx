import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gradebook | Admin | Elevate LMS',
  description: 'Select a course to view and manage student grades.',
};

export default async function AdminGradebookIndexPage() {
  await requireRole(['admin', 'super_admin', 'instructor']);
  const supabase = await getAdminClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, status')
    .order('title');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-gray-600 mt-1">Select a course to view and manage grades.</p>
        </div>

        <div className="space-y-3">
          {courses && courses.length > 0 ? (
            courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/gradebook/${course.id}`}
                className="flex items-center justify-between bg-white rounded-xl border p-5 hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                      {course.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="capitalize">{course.status || 'draft'}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition" />
              </Link>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              No courses found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
