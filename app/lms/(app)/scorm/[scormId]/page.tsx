import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Clock,
  CheckCircle,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/lms/scorm/' + scormId);
  }

  // Fetch SCORM package
  const { data: scorm, error } = await supabase
    .from('scorm_packages')
    .select(`
      *,
      courses (id, title)
    `)
    .eq('id', scormId)
    .single();

  if (error || !scorm) {
    notFound();
  }

  // Fetch user's progress
  const { data: progress } = await supabase
    .from('scorm_progress')
    .select('*')
    .eq('scorm_id', scormId)
    .eq('user_id', user.id)
    .single();

  const isCompleted = progress?.status === 'completed';
  const progressPercentage = progress?.progress_percentage || 0;

  const course = scorm.courses as { id: string; title: string } | null;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href={course ? `/lms/courses/${course.id}` : '/lms/courses'}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {course ? `Back to ${course.title}` : 'Back to Courses'}
        </Link>

        {/* SCORM Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{scorm.title}</h1>
              {scorm.description && (
                <p className="text-slate-600">{scorm.description}</p>
              )}
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Completed</span>
              </div>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Progress</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-brand-blue-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <BookOpen className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-semibold">SCORM {scorm.scorm_version || '1.2'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Duration</p>
              <p className="font-semibold">{scorm.duration_minutes || 30} min</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-brand-blue-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-semibold capitalize">{progress?.status || 'Not Started'}</p>
            </div>
          </div>

          {/* Launch Button */}
          {scorm.launch_url ? (
            <a
              href={scorm.launch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-blue-700 transition"
            >
              <Play className="w-5 h-5" />
              {progress ? 'Continue Learning' : 'Start Learning'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-yellow-800">SCORM content is not available at this time.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Instructions</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">1</span>
              <span>Click the &quot;Start Learning&quot; button to launch the content in a new window.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">2</span>
              <span>Complete all sections of the course material.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">3</span>
              <span>Your progress will be automatically tracked and saved.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">4</span>
              <span>Close the window when finished to return to this page.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
