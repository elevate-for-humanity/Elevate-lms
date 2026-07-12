import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { enrollStudentAction } from './actions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Add Student | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Enroll a new student in your course.',
};

export default async function InstructorAddStudentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Guard against null user
  if (!user) redirect('/login');
  const { data: courses } = await supabase
    .from('lms_courses')
    .select('id, course_name')
    .eq('instructor_id', user.id)
    .eq('is_active', true)
    .order('course_name');

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image
          src="/images/pages/instructor-page-13.webp"
          alt="Instructor portal"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Instructor', href: '/admin/instructor' },
            { label: 'Students', href: '/admin/instructor/students' },
            { label: 'Add Student' },
          ]}
        />
      </div>
      <h1 className="text-3xl font-bold mb-6">Add Student</h1>
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
        <form action={enrollStudentAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Full Name *</label>
            <input
              name="full_name"
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Student Email *</label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Phone</label>
            <input
              name="phone"
              type="tel"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="(317) 555-0100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Course</label>
            <select
              name="program_id"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">Select a course…</option>
              {(courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Any notes about this student…"
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700 font-medium transition-colors"
            >
              Add Student
            </button>
            <Link
              href="/admin/instructor/students"
              className="border border-slate-300 px-6 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
