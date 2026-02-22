import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Clock, BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course | Apprentice Portal | Elevate For Humanity',
  description: 'Complete your apprenticeship course modules.',
};

interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_index: number;
  completed: boolean;
}

export default async function ApprenticeCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  // Get enrollment with program
  const { data: enrollment } = await supabase
    .from('training_enrollments')
    .select('*, programs(id, name, slug)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) {
    redirect('/programs');
  }

  // Gate: Must complete orientation and documents first
  if (!enrollment.orientation_completed_at) {
    const programSlug = enrollment.programs?.slug || 'barber-apprenticeship';
    redirect(`/programs/${programSlug}/orientation`);
  }

  if (!enrollment.documents_submitted_at) {
    const programSlug = enrollment.programs?.slug || 'barber-apprenticeship';
    redirect(`/programs/${programSlug}/documents`);
  }

  // Get course from database
  const { data: course } = await supabase
    .from('training_courses')
    .select('*')
    .eq('id', id)
    .single();

  // Get course modules
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', id)
    .order('order_index', { ascending: true });

  // Get user's progress on modules
  const { data: progress } = await supabase
    .from('module_progress')
    .select('module_id, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', id);

  const completedModuleIds = new Set(progress?.map(p => p.module_id) || []);

  // If no course found, show default course structure
  const courseData = course || {
    id: id,
    name: id === '1' ? 'Barber Fundamentals' : `Course ${id}`,
    description: 'Learn the foundational skills and knowledge required for your apprenticeship.',
  };

  const moduleData: CourseModule[] = modules?.length ? modules.map(m => ({
    ...m,
    completed: completedModuleIds.has(m.id),
  })) : [
    {
      id: '1',
      title: 'Introduction & Safety',
      description: 'Overview of the program and essential safety protocols',
      duration_minutes: 30,
      order_index: 1,
      completed: false,
    },
    {
      id: '2',
      title: 'Tools & Equipment',
      description: 'Learn about the tools of the trade and proper maintenance',
      duration_minutes: 45,
      order_index: 2,
      completed: false,
    },
    {
      id: '3',
      title: 'Sanitation & Hygiene',
      description: 'State-required sanitation procedures and best practices',
      duration_minutes: 60,
      order_index: 3,
      completed: false,
    },
    {
      id: '4',
      title: 'Client Communication',
      description: 'Professional communication and consultation skills',
      duration_minutes: 30,
      order_index: 4,
      completed: false,
    },
    {
      id: '5',
      title: 'Assessment',
      description: 'Complete the module assessment to proceed',
      duration_minutes: 20,
      order_index: 5,
      completed: false,
    },
  ];

  const completedCount = moduleData.filter(m => m.completed).length;
  const totalMinutes = moduleData.reduce((sum, m) => sum + m.duration_minutes, 0);
  const progressPercent = moduleData.length > 0 ? Math.round((completedCount / moduleData.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/apprentice"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black mb-2">{courseData.name}</h1>
          <p className="text-slate-300">{courseData.description}</p>

          {/* Progress Bar */}
          <div className="mt-6 bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Course Progress</span>
              <span className="text-sm font-bold">{progressPercent}% Complete</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {moduleData.length} modules
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m total
              </span>
              <span className="flex items-center gap-1">
                <span className="text-slate-400 flex-shrink-0">•</span>
                {completedCount} completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Course Modules</h2>

        <div className="space-y-4">
          {moduleData.map((module, index) => {
            const isLocked = index > 0 && !moduleData[index - 1].completed;
            const isCurrent = !module.completed && (index === 0 || moduleData[index - 1].completed);

            return (
              <div
                key={module.id}
                className={`bg-white rounded-xl border-2 transition ${
                  module.completed
                    ? 'border-brand-green-200 bg-brand-green-50'
                    : isCurrent
                    ? 'border-brand-blue-500 shadow-lg'
                    : isLocked
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        module.completed
                          ? 'bg-brand-green-500 text-white'
                          : isCurrent
                          ? 'bg-brand-blue-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {module.completed ? (
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      ) : (
                        <span className="font-bold">{module.order_index}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{module.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.duration_minutes} min
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      {module.completed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-700 rounded-full text-sm font-medium">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          Complete
                        </span>
                      ) : isCurrent ? (
                        <Link
                          href={`/apprentice/courses/${id}/modules/${module.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Start
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-sm">Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
