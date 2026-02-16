import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { PlayCircle, Clock, Award, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/staff-portal/training',
  },
  title: 'Staff Training | Elevate For Humanity',
  description:
    'Complete training modules, track your progress, and earn completion certificates.',
};

/**
 * STAFF TRAINING PORTAL
 *
 * Features:
 * - View all training modules
 * - Track completion progress
 * - Take quizzes and earn completion certificates
 * - Video player integration
 */
export default async function StaffTrainingPage() {
  // Require staff or admin role
  const { user, profile } = await requireRole([
    'staff',
    'admin',
    'super_admin',
    'advisor',
  ]);

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

  // Get all training modules
  const { data: modules, error: modulesError } = await supabase
    .from('training_modules')
    .select('*')
    .order('order_index', { ascending: true });

  // Get user's progress
  const { data: progress, error: progressError } = await supabase
    .from('staff_training_progress')
    .select('*')
    .eq('user_id', user.id);

  // Combine modules with progress
  const modulesWithProgress = modules?.map((module) => {
    const userProgress = progress?.find((p) => p.module_id === module.id);
    return {
      ...module,
      progress: userProgress || null,
      isCompleted: !!userProgress?.completed_at,
      isCertified: !!userProgress?.certification_date,
    };
  });

  const totalModules = modules?.length || 0;
  const completedModules = progress?.filter((p) => p.completed_at).length || 0;
  const certifiedModules =
    progress?.filter((p) => p.certification_date).length || 0;
  const completionPercentage =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Training' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Staff Training
              </h1>
              <p className="text-black mt-2">
                Complete training modules and earn completion certificates
              </p>
            </div>
            <Link
              href="/staff-portal/dashboard"
              className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-11 w-11 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {totalModules}
              </span>
            </div>
            <p className="text-black text-sm">Total Modules</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-3xl font-bold text-black">
                {completedModules}
              </span>
            </div>
            <p className="text-black text-sm">Completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-11 w-11 text-yellow-600" />
              <span className="text-3xl font-bold text-black">
                {certifiedModules}
              </span>
            </div>
            <p className="text-black text-sm">Certifications</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-11 w-11 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {completionPercentage}%
              </span>
            </div>
            <p className="text-black text-sm">Progress</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-black">
              Overall Progress
            </h2>
            <span className="text-sm text-black">
              {completedModules} of {totalModules} modules completed
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4">
            <div
              className="bg-brand-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Training Modules */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-black">
            Training Modules
          </h2>

          {modulesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">
                Error loading modules: {modulesError.message}
              </p>
            </div>
          )}

          {!modules || modules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-black mb-2">
                No Training Modules Available
              </h3>
              <p className="text-black">
                Training modules will appear here once they are added by
                administrators.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modulesWithProgress?.map((module) => (
                <div
                  key={module.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {module.title}
                        </h3>
                        {module.required && (
                          <span className="px-2 py-2 bg-red-100 text-red-700 text-xs font-medium rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-black text-sm mb-3">
                        {module.description}
                      </p>
                      {module.duration && (
                        <p className="text-slate-500 text-sm flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.duration} minutes
                        </p>
                      )}
                    </div>
                    {module.isCompleted && (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    )}
                  </div>

                  {module.progress && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-black">
                          Completed:{' '}
                          {new Date(
                            module.progress.completed_at
                          ).toLocaleDateString()}
                        </span>
                        {module.progress.quiz_score && (
                          <span className="font-medium text-black">
                            Score: {module.progress.quiz_score}%
                          </span>
                        )}
                      </div>
                      {module.isCertified && (
                        <div className="mt-2 flex items-center gap-2 text-yellow-700">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">Certified</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {module.video_url && (
                      <a
                        href={module.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
                      >
                        <PlayCircle className="h-5 w-5" />
                        Watch Video
                      </a>
                    )}
                    {!module.isCompleted && (
                      <button
                        className="flex-1 px-4 py-2 bg-slate-100 text-black rounded-lg hover:bg-slate-200 transition-colors"
                        onClick={() => {
                          alert(
                            'Quiz functionality will be implemented with interactive modal'
                          );
                        }}
                      >
                        Take Quiz
                      </button>
                    )}
                    {module.isCompleted && !module.isCertified && (
                      <button
                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                        onClick={() => {
                          alert(
                            'Retake quiz to improve score and earn certification (80%+ required)'
                          );
                        }}
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
