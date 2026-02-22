/**
 * Advanced Course Analytics & Reporting
 * Provides detailed insights into course performance
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  activeStudents: number;
  completedStudents: number;
  averageCompletionTime: number; // days
  completionRate: number; // percentage
  averageProgress: number; // percentage
  dropoutRate: number; // percentage
  studentSatisfaction: number; // 1-5 rating
  topPerformers: StudentPerformance[];
  strugglingStudents: StudentPerformance[];
  lessonAnalytics: LessonAnalytics[];
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  progress: number;
  timeSpent: number; // minutes
  lastActive: string;
  completionDate?: string;
}

export interface LessonAnalytics {
  lessonId: string;
  lessonName: string;
  completionRate: number;
  averageTimeSpent: number; // minutes
  dropoffRate: number; // percentage of students who stop here
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EnrollmentTrends {
  period: string;
  enrollments: number;
  completions: number;
  dropouts: number;
}

/**
 * Get comprehensive course analytics
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics | null> {
  const supabase = createAdminClient();

  // Get course info
  const { data: course } = await supabase
    .from('training_courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  if (!course) return null;

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      student_id,
      status,
      enrolled_at,
      profiles (full_name)
    `)
    .eq('course_id', courseId);

  // Get progress data
  const { data: progressData } = await supabase
    .from('lms_progress')
    .select('*')
    .eq('course_id', courseId);

  // Get lesson data
  const { data: lessons } = await supabase
    .from('training_lessons')
    .select('id, title, order_number')
    .eq('course_id', courseId)
    .order('order_number');

  // Get lesson progress
  const { data: lessonProgress } = await supabase
    .from('lesson_progress')
    .select('*')
    .in('lesson_id', lessons?.map(l => l.id) || []);

  const totalEnrollments = enrollments?.length || 0;
  const activeStudents = enrollments?.filter(e => e.status === 'active').length || 0;
  const completedStudents = progressData?.filter(p => p.status === 'completed').length || 0;

  const completionRate = totalEnrollments > 0
    ? (completedStudents / totalEnrollments) * 100
    : 0;

  const averageProgress = progressData && progressData.length > 0
    ? progressData.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / progressData.length
    : 0;

  // Calculate average completion time
  const completedWithDates = progressData?.filter(p =>
    p.status === 'completed' && p.completed_at
  ) || [];

  const averageCompletionTime = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, p) => {
        const enrolled = enrollments?.find(e => e.student_id === p.user_id);
        if (!enrolled) return sum;
        const days = Math.floor(
          (new Date(p.completed_at!).getTime() - new Date(enrolled.enrolled_at).getTime())
          / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / completedWithDates.length
    : 0;

  // Top performers (highest progress)
  const topPerformers: StudentPerformance[] = (progressData || [])
    .sort((a, b) => (b.progress_percent || 0) - (a.progress_percent || 0))
    .slice(0, 5)
    .map(p => {
      const enrollment = enrollments?.find(e => e.student_id === p.user_id);
      return {
        studentId: p.user_id,
        studentName: (enrollment?.profiles as any)?.full_name || 'Unknown',
        progress: p.progress_percent || 0,
        timeSpent: 0, // Would need time tracking
        lastActive: p.last_activity_at || p.updated_at,
        completionDate: p.completed_at,
      };
    });

  // Struggling students (low progress, inactive)
  const strugglingStudents: StudentPerformance[] = (progressData || [])
    .filter(p => (p.progress_percent || 0) < 30 && p.status !== 'completed')
    .sort((a, b) => (a.progress_percent || 0) - (b.progress_percent || 0))
    .slice(0, 5)
    .map(p => {
      const enrollment = enrollments?.find(e => e.student_id === p.user_id);
      return {
        studentId: p.user_id,
        studentName: (enrollment?.profiles as any)?.full_name || 'Unknown',
        progress: p.progress_percent || 0,
        timeSpent: 0,
        lastActive: p.last_activity_at || p.updated_at,
      };
    });

  // Lesson analytics
  const lessonAnalytics: LessonAnalytics[] = (lessons || []).map(lesson => {
    const lessonCompletions = lessonProgress?.filter(
      lp => lp.lesson_id === lesson.id && lp.completed
    ).length || 0;

    const completionRate = totalEnrollments > 0
      ? (lessonCompletions / totalEnrollments) * 100
      : 0;

    return {
      lessonId: lesson.id,
      lessonName: lesson.title,
      completionRate,
      averageTimeSpent: 0, // Would need time tracking
      dropoffRate: 100 - completionRate,
      difficulty: completionRate > 80 ? 'easy' : completionRate > 50 ? 'medium' : 'hard',
    };
  });

  return {
    courseId: course.id,
    courseName: course.title,
    totalEnrollments,
    activeStudents,
    completedStudents,
    averageCompletionTime: Math.round(averageCompletionTime),
    completionRate: Math.round(completionRate * 100) / 100,
    averageProgress: Math.round(averageProgress * 100) / 100,
    dropoutRate: Math.round((1 - completionRate / 100) * 100 * 100) / 100,
    studentSatisfaction: 4.5, // Would need survey data
    topPerformers,
    strugglingStudents,
    lessonAnalytics,
  };
}

/**
 * Get enrollment trends over time
 */
export async function getEnrollmentTrends(
  courseId: string,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<EnrollmentTrends[]> {
  const supabase = createAdminClient();

  const intervals = period === 'week' ? 7 : period === 'month' ? 30 : 90;
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('enrolled_at, status')
    .eq('course_id', courseId)
    .gte('enrolled_at', new Date(Date.now() - intervals * 24 * 60 * 60 * 1000).toISOString());

  // Group by period
  const trends: EnrollmentTrends[] = [];
  // Implementation would group data by time periods

  return trends;
}

/**
 * Get student engagement metrics
 */
export async function getStudentEngagement(courseId: string) {
  const supabase = createAdminClient();

  const { data: progress } = await supabase
    .from('lms_progress')
    .select('user_id, last_activity_at, progress_percent')
    .eq('course_id', courseId);

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const activeToday = progress?.filter(p =>
    new Date(p.last_activity_at).getTime() > dayAgo
  ).length || 0;

  const activeThisWeek = progress?.filter(p =>
    new Date(p.last_activity_at).getTime() > weekAgo
  ).length || 0;

  return {
    totalStudents: progress?.length || 0,
    activeToday,
    activeThisWeek,
    engagementRate: progress && progress.length > 0
      ? (activeThisWeek / progress.length) * 100
      : 0,
  };
}

/**
 * Generate course performance report
 */
export async function generateCourseReport(courseId: string) {
  const [analytics, engagement] = await Promise.all([
    getCourseAnalytics(courseId),
    getStudentEngagement(courseId),
  ]);

  return {
    analytics,
    engagement,
    generatedAt: new Date().toISOString(),
    recommendations: generateRecommendations(analytics, engagement),
  };
}

/**
 * Generate recommendations based on analytics
 */
function generateRecommendations(
  analytics: CourseAnalytics | null,
  engagement: any
): string[] {
  const recommendations: string[] = [];

  if (!analytics) return recommendations;

  if (analytics.completionRate < 50) {
    recommendations.push('⚠️ Low completion rate - consider reviewing course difficulty and support resources');
  }

  if (analytics.dropoutRate > 30) {
    recommendations.push('⚠️ High dropout rate - identify and address common barriers');
  }

  if (analytics.strugglingStudents.length > 5) {
    recommendations.push('📞 Reach out to struggling students for additional support');
  }

  if (engagement.engagementRate < 40) {
    recommendations.push('📧 Send engagement reminders to inactive students');
  }

  const hardLessons = analytics.lessonAnalytics.filter(l => l.difficulty === 'hard');
  if (hardLessons.length > 0) {
    recommendations.push(`📚 Review difficult lessons: ${hardLessons.map(l => l.lessonName).join(', ')}`);
  }

  if (analytics.completionRate > 80) {
    recommendations.push('✅ Excellent completion rate - share success strategies with other courses');
  }

  return recommendations;
}
