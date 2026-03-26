import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import CourseGeneratorClient from './CourseGeneratorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Course Builder | Admin | Elevate LMS',
  description: 'Generate a course from a syllabus, script, PDF, or prompt.',
};

export default async function CourseGeneratorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const db = createAdminClient();
  const { data: programs } = await supabase
    .from('training_programs')
    .select('id, name, category')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">AI Course Builder</h1>
          <p className="text-slate-500 mt-1">
            Paste a syllabus, upload a PDF or DOCX, or describe a course. Review and publish.
          </p>
        </div>
        <CourseGeneratorClient programs={programs ?? []} />
      </div>
    </div>
  );
}
