import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ScormPlayerWrapper } from './ScormPlayerWrapper';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ scormId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scormId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return { title: 'SCORM Content | Elevate LMS' };
  }

  const { data: scorm } = await supabase
    .from('scorm_packages')
    .select('title')
    .eq('id', scormId)
    .single();

  return {
    title: scorm ? `${scorm.title} | Elevate LMS` : 'SCORM Content | Elevate LMS',
  };
}

export default async function ScormPage({ params }: Props) {
  const { scormId } = await params;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/scorm/' + scormId);
  }

  // Fetch SCORM package
  const { data: scorm, error } = await supabase
    .from('scorm_packages')
    .select('*, courses (id, title)')
    .eq('id', scormId)
    .single();

  if (error || !scorm) {
    notFound();
  }

  // Fetch user's progress from scorm_enrollments
  const { data: enrollment } = await supabase
    .from('scorm_enrollments')
    .select('*')
    .eq('scorm_package_id', scormId)
    .eq('user_id', user.id)
    .single();

  const course = scorm.courses as { id: string; title: string } | null;

  // Determine the launch URL — prefer internal content API
  const launchUrl =
    scorm.launch_url ||
    (scorm.launch_path
      ? `/api/scorm/content/${scormId}/${scorm.launch_path}`
      : null);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={course ? `/lms/courses/${course.id}` : '/lms/courses'}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {course ? course.course_name : 'Back to Courses'}
            </span>
          </Link>
          <div className="h-5 w-px bg-slate-300" />
          <h1 className="text-lg font-semibold text-slate-900 truncate">
            {scorm.title}
          </h1>
        </div>
        <div className="text-sm text-slate-500">
          SCORM {scorm.scorm_version || '1.2'}
        </div>
      </div>

      {/* Player */}
      {launchUrl ? (
        <ScormPlayerWrapper
          packageId={scormId}
          launchUrl={launchUrl}
          version={(scorm.scorm_version as '1.2' | '2004') || '1.2'}
          userId={user.id}
          enrollmentStatus={enrollment?.status}
          enrollmentProgress={enrollment?.progress_percentage}
          enrollmentScore={enrollment?.score}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-md">
            <p className="text-yellow-800 font-medium mb-2">
              SCORM content not available
            </p>
            <p className="text-yellow-700 text-sm">
              This package has not been extracted yet. An administrator needs to
              re-upload the SCORM ZIP to extract its contents.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
