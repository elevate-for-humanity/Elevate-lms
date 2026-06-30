import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createCourseAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/courses/new' },
  title: 'Create Course',
  description: 'Create a new course in the LMS.',
};

export default async function NewCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'instructor' && profile?.role !== 'admin') redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/lms/dashboard" className="hover:text-primary">
                  LMS
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/lms/courses" className="hover:text-primary">
                  Courses
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">New</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Create New Course</h1>
          <p className="text-slate-700 mt-2">Set up a new course for learners</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form action={createCourseAction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Course Title *
              </label>
              <input
                name="course_name"
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Enter course title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
              <textarea
                name="description"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                rows={4}
                placeholder="Course description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Category</label>
                <select
                  name="category"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Skilled Trades">Skilled Trades</option>
                  <option value="Business">Business</option>
                  <option value="Cosmetology">Cosmetology</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Duration (hours)
                </label>
                <input
                  name="duration_hours"
                  type="number"
                  min="1"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g. 40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Price ($)</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500"
                placeholder="0.00"
                defaultValue="0"
              />
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 font-medium transition-colors"
              >
                Create Course
              </button>
              <Link
                href="/lms/dashboard"
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
