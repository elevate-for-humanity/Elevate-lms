import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CourseIngestionWizard from './CourseIngestionWizard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Course | Admin | Elevate LMS',
  description: 'Build a new course from a prompt, syllabus, script, or document.',
};

export default async function CreateCoursePage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin', 'org_admin', 'instructor'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title')
    .eq('status', 'active')
    .order('title');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
            <li>/</li>
            <li><Link href="/admin/courses" className="hover:text-brand-blue-600">Courses</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Create</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-500 mt-1">
            Describe what you want, or upload a syllabus, script, or document. The AI compiler builds the draft.
          </p>
        </div>

        <CourseIngestionWizard programs={programs || []} />
      </div>
    </div>
  );
}
