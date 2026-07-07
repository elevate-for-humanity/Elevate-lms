import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Grades | Elevate for Humanity',
  description: 'Grades page content.',
};

export default async function GradesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch enrollments then hydrate course details separately (no FK on course_id)
  const { data: rawGradeEnrollments } = await supabase
    .from('program_enrollments')
    .select('id, status, course_id, progress_percent, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const gradeCourseIds = [
    ...new Set((rawGradeEnrollments || []).map((e: any) => e.course_id).filter(Boolean)),
  ];
  const { data: gradeCourses } = gradeCourseIds.length
    ? await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .in('id', gradeCourseIds)
    : { data: [] };
  const gradeCourseMap = Object.fromEntries((gradeCourses || []).map((c: any) => [c.id, c]));
  const enrollments = (rawGradeEnrollments || []).map((e: any) => ({
    ...e,
    courses: gradeCourseMap[e.course_id] ?? null,
  }));

  // Fetch assignment submissions with grades
  const { data: assignmentSubmissions } = await supabase
    .from('assignment_submissions')
    .select(
      `
      *,
      assignments (
        id,
        title,
        max_points,
        course_id
      )
    `,
    )
    .eq('student_id', user.id)
    .not('grade', 'is', null)
    .order('graded_at', { ascending: false });

  // Fetch quiz attempts with scores
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select(
      `
      *,
      quizzes (
        id,
        title,
        course_id
      )
    `,
    )
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
    assignmentSubmissions.forEach((sub) => {
      if (sub.assignments?.course_id) {
        stats.coursesWithGrades.add(sub.assignments.course_id);
      }
    });
  }

  if (quizAttempts && quizAttempts.length > 0) {
    const totalScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0);
    stats.avgQuizScore = Math.round(totalScore / quizAttempts.length);
    quizAttempts.forEach((attempt) => {
      if (attempt.quizzes?.course_id) {
        stats.coursesWithGrades.add(attempt.quizzes.course_id);
      }
    });
  }

  // Calculate course grades
  const courseGrades: Record<
    string,
    {
      courseId: string;
      courseTitle: string;
      assignments: { title: string; grade: number; maxPoints: number; date: string }[];
      quizzes: { title: string; score: number; date: string }[];
      overallGrade: number;
    }
  > = {};

  assignmentSubmissions?.forEach((sub) => {
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

  quizAttempts?.forEach((attempt) => {
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
  Object.values(courseGrades).forEach((course) => {
    let totalPoints = 0;
    let earnedPoints = 0;

    course.assignments.forEach((a) => {
      totalPoints += a.maxPoints;
      earnedPoints += a.grade;
    });

    course.quizzes.forEach((q) => {
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
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Grades</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
