import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  CheckCircle,
  Play,
  GraduationCap,
} from 'lucide-react';

type Params = Promise<{ programId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { programId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  const { data: program } = await db
    .from('programs')
    .select('title')
    .or(`id.eq.${programId},slug.eq.${programId},code.eq.${programId}`)
    .single();

  return {
    title: program ? `${program.title} | My Program` : 'My Program | Elevate LMS',
    description: 'Your program dashboard — track courses, progress, and certifications.',
  };
}

export default async function ProgramDashboardPage({ params }: { params: Params }) {
  const { programId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/program/' + programId);

  // Look up program by id, slug, or code
  const { data: program } = await db
    .from('programs')
    .select('id, title, slug, code, description, duration_weeks, completion_criteria')
    .or(`id.eq.${programId},slug.eq.${programId},code.eq.${programId}`)
    .single();

  if (!program) notFound();

  // Verify enrollment
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrolled_at, progress_percent')
    .eq('user_id', user.id)
    .eq('program_id', program.id)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    // Not enrolled — redirect to program page
    redirect(`/programs/${program.slug || program.code || programId}`);
  }

  // Get courses for this program
  const { data: courses } = await db
    .from('training_courses')
    .select('id, course_name, description, duration_hours, is_active')
    .eq('program_id', program.id)
    .order('created_at', { ascending: true });

  // Get lesson counts and progress per course
  const courseIds = (courses || []).map((c: any) => c.id);

  const { data: allLessons } = courseIds.length > 0
    ? await db
        .from('training_lessons')
        .select('id, course_id')
        .in('course_id', courseIds)
    : { data: [] };

  const { data: lessonProgress } = courseIds.length > 0
    ? await db
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .in('lesson_id', (allLessons || []).map((l: any) => l.id))
    : { data: [] };

  const progressMap = new Map(
    (lessonProgress || []).map((p: any) => [p.lesson_id, p.completed])
  );

  // Build per-course stats
  const courseStats = (courses || []).map((course: any) => {
    const lessons = (allLessons || []).filter((l: any) => l.course_id === course.id);
    const completed = lessons.filter((l: any) => progressMap.get(l.id)).length;
    const total = lessons.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { ...course, lessonCount: total, completedCount: completed, percent };
  });

  // Overall progress
  const totalLessons = (allLessons || []).length;
  const completedLessons = (allLessons || []).filter((l: any) => progressMap.get(l.id)).length;
  const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Get certificates for this program
  const { data: certificates } = await db
    .from('certificates')
    .select('id, title, issued_at')
    .eq('user_id', user.id)
    .eq('program_id', program.id);

  const statusLabel: Record<string, { text: string; color: string }> = {
    active: { text: 'Active', color: 'bg-brand-green-100 text-brand-green-700' },
    confirmed: { text: 'Active', color: 'bg-brand-green-100 text-brand-green-700' },
    completed: { text: 'Completed', color: 'bg-brand-blue-100 text-brand-blue-700' },
    withdrawn: { text: 'Withdrawn', color: 'bg-gray-100 text-gray-600' },
    pending: { text: 'Pending', color: 'bg-amber-100 text-amber-700' },
    paid: { text: 'Pending', color: 'bg-amber-100 text-amber-700' },
  };

  const status = statusLabel[enrollment.status] || statusLabel.pending;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'LMS', href: '/lms/dashboard' },
          { label: program.title },
        ]} />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Program Header */}
        <div className="bg-slate-900 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">{program.title}</h1>
          </div>
          {program.description && (
            <p className="text-white/80 mb-4 max-w-2xl">{program.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
            {program.duration_weeks && (
              <span className="flex items-center gap-1 text-white/70 text-sm">
                <Clock className="w-4 h-4" /> {program.duration_weeks} weeks
              </span>
            )}
            <span className="flex items-center gap-1 text-white/70 text-sm">
              <BookOpen className="w-4 h-4" /> {courseStats.length} course{courseStats.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-white/70 text-sm">
              <Award className="w-4 h-4" /> {certificates?.length || 0} certificate{(certificates?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Overall Progress Bar */}
          <div className="bg-white/15 rounded-xl p-4 border border-white/20 max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-white">Overall Progress</span>
              <span className="font-bold text-white">{overallPercent}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-1">
              {completedLessons} of {totalLessons} lessons completed
            </p>
          </div>
        </div>

        {/* Courses Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Courses</h2>

        {courseStats.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-500">Courses for this program have not been published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {courseStats.map((course: any) => (
              <Link
                key={course.id}
                href={`/lms/courses/${course.id}`}
                className="bg-white rounded-xl border hover:border-brand-blue-300 hover:shadow-md transition p-6 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition">
                    {course.course_name}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition flex-shrink-0" />
                </div>

                {course.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {course.lessonCount} lessons
                  </span>
                  {course.duration_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {course.duration_hours}h
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      course.percent === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'
                    }`}
                    style={{ width: `${course.percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {course.completedCount}/{course.lessonCount} lessons
                  </span>
                  {course.percent === 100 ? (
                    <span className="flex items-center gap-1 text-brand-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </span>
                  ) : course.percent > 0 ? (
                    <span className="flex items-center gap-1 text-brand-blue-600 font-medium">
                      <Play className="w-3.5 h-3.5" /> Continue
                    </span>
                  ) : (
                    <span className="text-gray-400">Not started</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Certificates Section */}
        {(certificates?.length || 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Certificates Earned</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {certificates!.map((cert: any) => (
                <div key={cert.id} className="bg-white rounded-xl border p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cert.title}</h3>
                    {cert.issued_at && (
                      <p className="text-sm text-gray-500">
                        Issued {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/lms/dashboard"
            className="bg-white rounded-xl border p-4 hover:border-brand-blue-300 transition text-center"
          >
            <span className="text-sm font-medium text-gray-700">Back to Dashboard</span>
          </Link>
          <Link
            href="/lms/certificates"
            className="bg-white rounded-xl border p-4 hover:border-brand-blue-300 transition text-center"
          >
            <span className="text-sm font-medium text-gray-700">All Certificates</span>
          </Link>
          <Link
            href="/support"
            className="bg-white rounded-xl border p-4 hover:border-brand-blue-300 transition text-center"
          >
            <span className="text-sm font-medium text-gray-700">Get Help</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
