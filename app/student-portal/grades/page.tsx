import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GraduationCap, BookOpen, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Grades | Student Portal',
  description: 'View your academic grades and progress.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StudentPortalGradesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student-portal/grades');
  }

  // Fetch grades from database
  const { data: grades } = await db
    .from('grades')
    .select(`
      id,
      grade,
      score,
      max_score,
      status,
      graded_at,
      courses:course_id (name, code),
      assignments:assignment_id (title)
    `)
    .eq('student_id', user.id)
    .order('graded_at', { ascending: false });

  // Fetch course progress/completion
  const { data: enrollments } = await db
    .from('training_enrollments')
    .select(`
      id,
      progress,
      status,
      final_grade,
      completed_at,
      programs:program_id (name, title)
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  // Also check course_enrollments table
  const { data: courseEnrollments } = await db
    .from('course_enrollments')
    .select(`
      id,
      progress,
      status,
      grade,
      completed_at,
      courses:course_id (name, title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const gradesList = grades || [];
  const enrollmentsList = enrollments || [];
  const courseEnrollmentsList = courseEnrollments || [];

  // Calculate stats from actual data
  const completedCourses = [...enrollmentsList, ...courseEnrollmentsList].filter(
    (e: any) => e.status === 'completed'
  );
  
  const gradesWithScores = gradesList.filter((g: any) => g.score !== null && g.max_score);
  const averageScore = gradesWithScores.length > 0
    ? Math.round(gradesWithScores.reduce((sum: number, g: any) => sum + (g.score / g.max_score) * 100, 0) / gradesWithScores.length)
    : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'text-gray-600';
    const g = grade.toUpperCase();
    if (g.startsWith('A')) return 'text-brand-green-600';
    if (g.startsWith('B')) return 'text-brand-blue-600';
    if (g.startsWith('C')) return 'text-yellow-600';
    if (g.startsWith('D')) return 'text-brand-orange-600';
    return 'text-brand-red-600';
  };

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/student-portal-page-3.jpg" alt="Student portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Student Portal", href: "/student-portal" }, { label: "Grades" }]} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Grades & Progress</h1>
          <p className="text-gray-600 mt-1">View your academic performance</p>
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6 text-center">
            <GraduationCap className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Courses Completed</p>
            <p className="text-3xl font-bold text-brand-blue-600">{completedCourses.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <BookOpen className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Assignments Graded</p>
            <p className="text-3xl font-bold text-brand-green-600">{gradesList.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-purple-600">
              {averageScore !== null ? `${averageScore}%` : '--'}
            </p>
          </div>
        </div>

        {/* Course Progress */}
        {(enrollmentsList.length > 0 || courseEnrollmentsList.length > 0) && (
          <section className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Course Progress</h2>
            <div className="space-y-4">
              {enrollmentsList.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {enrollment.programs?.name || enrollment.programs?.title || 'Program'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {enrollment.status === 'completed' 
                        ? `Completed ${enrollment.completed_at ? formatDate(enrollment.completed_at) : ''}`
                        : `${enrollment.progress || 0}% complete`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    {enrollment.final_grade ? (
                      <span className={`text-2xl font-bold ${getGradeColor(enrollment.final_grade)}`}>
                        {enrollment.final_grade}
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        enrollment.status === 'completed' 
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : 'bg-brand-blue-100 text-brand-blue-700'
                      }`}>
                        {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {courseEnrollmentsList.map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {enrollment.courses?.name || enrollment.courses?.title || 'Course'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {enrollment.status === 'completed' 
                        ? `Completed ${enrollment.completed_at ? formatDate(enrollment.completed_at) : ''}`
                        : `${enrollment.progress || 0}% complete`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    {enrollment.grade ? (
                      <span className={`text-2xl font-bold ${getGradeColor(enrollment.grade)}`}>
                        {enrollment.grade}
                      </span>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        enrollment.status === 'completed' 
                          ? 'bg-brand-green-100 text-brand-green-700'
                          : 'bg-brand-blue-100 text-brand-blue-700'
                      }`}>
                        {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assignment Grades */}
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-semibold mb-4">Assignment Grades</h2>
          
          {gradesList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Assignment</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Course</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Score</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Grade</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesList.map((grade: any) => (
                    <tr key={grade.id} className="border-b">
                      <td className="py-3">
                        <span className="font-medium text-gray-900">
                          {grade.assignments?.title || 'Assignment'}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {grade.courses?.name || grade.courses?.code || '--'}
                      </td>
                      <td className="py-3">
                        {grade.score !== null && grade.max_score ? (
                          <span className="text-gray-900">
                            {grade.score}/{grade.max_score}
                            <span className="text-gray-500 ml-1">
                              ({Math.round((grade.score / grade.max_score) * 100)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="py-3">
                        {grade.grade ? (
                          <span className={`font-semibold ${getGradeColor(grade.grade)}`}>
                            {grade.grade}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500 text-sm">
                        {grade.graded_at ? formatDate(grade.graded_at) : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grades yet</h3>
              <p className="text-gray-600">
                Your grades will appear here as assignments are graded.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
