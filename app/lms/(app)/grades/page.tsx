export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  TrendingUp,
  Award,
  FileText,
  Circle,
  Clock,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/grades',
  },
  title: 'My Grades | Student Portal',
  description: 'View your grades, assignment scores, and quiz results.',
};

export default async function GradesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Grades" }]} />
        </div>
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
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch enrollments with course details
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch assignment submissions with grades
  const { data: assignmentSubmissions } = await db
    .from('assignment_submissions')
    .select(`
      *,
      assignments (
        id,
        title,
        max_points,
        course_id,
        courses (title)
      )
    `)
    .eq('student_id', user.id)
    .not('grade', 'is', null)
    .order('graded_at', { ascending: false });

  // Fetch quiz attempts with scores
  const { data: quizAttempts } = await db
    .from('quiz_attempts')
    .select(`
      *,
      quizzes (
        id,
        title,
        course_id,
        courses (title)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  // Calculate overall statistics
  const stats = {
    totalAssignments: assignmentSubmissions?.length || 0,
    totalQuizzes: quizAttempts?.length || 0,
    avgAssignmentGrade: 0,
    avgQuizScore: 0,
    coursesWithGrades: new Set<string>(),
  };

  if (assignmentSubmissions && assignmentSubmissions.length > 0) {
    const totalPercentage = assignmentSubmissions.reduce((sum, sub) => {
      const maxPoints = sub.assignments?.max_points || 100;
      return sum + ((sub.grade || 0) / maxPoints) * 100;
    }, 0);
    stats.avgAssignmentGrade = Math.round(totalPercentage / assignmentSubmissions.length);
    assignmentSubmissions.forEach(sub => {
      if (sub.assignments?.course_id) {
        stats.coursesWithGrades.add(sub.assignments.course_id);
      }
    });
  }

  if (quizAttempts && quizAttempts.length > 0) {
    const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    stats.avgQuizScore = Math.round(totalScore / quizAttempts.length);
    quizAttempts.forEach(attempt => {
      if (attempt.quizzes?.course_id) {
        stats.coursesWithGrades.add(attempt.quizzes.course_id);
      }
    });
  }

  // Calculate course grades
  const courseGrades: Record<string, { 
    courseId: string;
    courseTitle: string;
    assignments: { title: string; grade: number; maxPoints: number; date: string }[];
    quizzes: { title: string; score: number; date: string }[];
    overallGrade: number;
  }> = {};

  assignmentSubmissions?.forEach(sub => {
    const courseId = sub.assignments?.course_id;
    const courseTitle = sub.assignments?.courses?.title || 'Unknown Course';
    if (courseId) {
      if (!courseGrades[courseId]) {
        courseGrades[courseId] = {
          courseId,
          courseTitle,
          assignments: [],
          quizzes: [],
          overallGrade: 0,
        };
      }
      courseGrades[courseId].assignments.push({
        title: sub.assignments?.title || 'Assignment',
        grade: sub.grade || 0,
        maxPoints: sub.assignments?.max_points || 100,
        date: sub.graded_at || sub.submitted_at,
      });
    }
  });

  quizAttempts?.forEach(attempt => {
    const courseId = attempt.quizzes?.course_id;
    const courseTitle = attempt.quizzes?.courses?.title || 'Unknown Course';
    if (courseId) {
      if (!courseGrades[courseId]) {
        courseGrades[courseId] = {
          courseId,
          courseTitle,
          assignments: [],
          quizzes: [],
          overallGrade: 0,
        };
      }
      courseGrades[courseId].quizzes.push({
        title: attempt.quizzes?.title || 'Quiz',
        score: attempt.score || 0,
        date: attempt.completed_at,
      });
    }
  });

  // Calculate overall grade for each course
  Object.values(courseGrades).forEach(course => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    course.assignments.forEach(a => {
      totalPoints += a.maxPoints;
      earnedPoints += a.grade;
    });
    
    course.quizzes.forEach(q => {
      totalPoints += 100;
      earnedPoints += q.score;
    });
    
    course.overallGrade = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  });

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-brand-green-600 bg-brand-green-100';
    if (grade >= 80) return 'text-brand-blue-600 bg-brand-blue-100';
    if (grade >= 70) return 'text-yellow-600 bg-yellow-100';
    if (grade >= 60) return 'text-brand-orange-600 bg-brand-orange-100';
    return 'text-brand-red-600 bg-brand-red-100';
  };

  const getLetterGrade = (grade: number) => {
    if (grade >= 93) return 'A';
    if (grade >= 90) return 'A-';
    if (grade >= 87) return 'B+';
    if (grade >= 83) return 'B';
    if (grade >= 80) return 'B-';
    if (grade >= 77) return 'C+';
    if (grade >= 73) return 'C';
    if (grade >= 70) return 'C-';
    if (grade >= 67) return 'D+';
    if (grade >= 63) return 'D';
    if (grade >= 60) return 'D-';
    return 'F';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const hasGrades = stats.totalAssignments > 0 || stats.totalQuizzes > 0;

  return (
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Grades" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Grades</h1>
          <p className="text-slate-600 mt-1">
            View your assignment scores, quiz results, and course grades
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.coursesWithGrades.size}
                </div>
                <div className="text-xs text-slate-600">Courses</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.totalAssignments}
                </div>
                <div className="text-xs text-slate-600">Assignments</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Circle className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.totalQuizzes}
                </div>
                <div className="text-xs text-slate-600">Quizzes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {hasGrades ? Math.round((stats.avgAssignmentGrade + stats.avgQuizScore) / 2) : 0}%
                </div>
                <div className="text-xs text-slate-600">Average</div>
              </div>
            </div>
          </div>
        </div>

        {hasGrades ? (
          <div className="space-y-6">
            {/* Course Grades */}
            {Object.values(courseGrades).map((course) => (
              <div
                key={course.courseId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-brand-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {course.courseTitle}
                        </h2>
                        <p className="text-sm text-slate-600">
                          {course.assignments.length} assignments • {course.quizzes.length} quizzes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${getGradeColor(course.overallGrade)}`}>
                        <span className="text-2xl font-bold">{getLetterGrade(course.overallGrade)}</span>
                        <span className="text-sm font-medium">({course.overallGrade}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Assignments */}
                  {course.assignments.length > 0 && (
                    <div className="p-6">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                        Assignments
                      </h3>
                      <div className="space-y-3">
                        {course.assignments.map((assignment, idx) => {
                          const percentage = Math.round((assignment.grade / assignment.maxPoints) * 100);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <div>
                                  <p className="font-medium text-slate-900">{assignment.title}</p>
                                  <p className="text-sm text-slate-500">{formatDate(assignment.date)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${getGradeColor(percentage)} px-3 py-1 rounded-lg`}>
                                  {assignment.grade}/{assignment.maxPoints}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{percentage}%</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quizzes */}
                  {course.quizzes.length > 0 && (
                    <div className="p-6">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                        Quizzes
                      </h3>
                      <div className="space-y-3">
                        {course.quizzes.map((quiz, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Circle className="w-5 h-5 text-slate-400" />
                              <div>
                                <p className="font-medium text-slate-900">{quiz.title}</p>
                                <p className="text-sm text-slate-500">{formatDate(quiz.date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${getGradeColor(quiz.score)} px-3 py-1 rounded-lg`}>
                                {quiz.score}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Grade Summary</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-brand-green-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-brand-green-600" />
                    <span className="font-semibold text-brand-green-900">Assignment Average</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-green-600">
                    {stats.avgAssignmentGrade}%
                  </div>
                  <p className="text-sm text-brand-green-700 mt-1">
                    Based on {stats.totalAssignments} graded assignments
                  </p>
                </div>
                <div className="p-4 bg-brand-blue-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Circle className="w-5 h-5 text-brand-blue-600" />
                    <span className="font-semibold text-brand-blue-900">Quiz Average</span>
                  </div>
                  <div className="text-3xl font-bold text-brand-blue-600">
                    {stats.avgQuizScore}%
                  </div>
                  <p className="text-sm text-brand-blue-700 mt-1">
                    Based on {stats.totalQuizzes} completed quizzes
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Grades Yet</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Complete assignments and quizzes in your enrolled courses to see your grades here.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/learner/assignments"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
              >
                <FileText className="w-5 h-5" />
                View Assignments
              </Link>
              <Link
                href="/learner/quizzes"
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-white transition"
              >
                <Circle className="w-5 h-5" />
                Take Quizzes
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
