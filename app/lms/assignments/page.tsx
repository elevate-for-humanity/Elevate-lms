import { logger } from '@/lib/logger';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Assignments | Elevate for Humanity',
  description: 'Assignments page content.',
};

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let assignments: any[] = [];
  let submissions: any[] = [];
  const stats = { pending: 0, submitted: 0, graded: 0, overdue: 0 };

  try {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const courseIds = enrollments?.map((e) => e.course_id) || [];

    if (courseIds.length > 0) {
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('id, title, description, due_date, course_id, max_points, submission_type')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });

      if (assignmentData) {
        assignments = assignmentData;
      }

      const { data: submissionData } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (submissionData) {
        submissions = submissionData;
      }
    }

    const now = new Date();
    assignments.forEach((assignment) => {
      const submission = submissions.find((s) => s.assignment_id === assignment.id);
      const dueDate = new Date(assignment.due_date);

      if (submission) {
        if (submission.grade !== null) {
          stats.graded++;
        } else {
          stats.submitted++;
        }
      } else if (dueDate < now) {
        stats.overdue++;
      } else {
        stats.pending++;
      }
    });
  } catch (error) {
    logger.error('Error:', error);
  }

  const getSubmissionStatus = (assignment: any) => {
    const submission = submissions.find((s) => s.assignment_id === assignment.id);
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (submission) {
      if (submission.grade !== null) {
        return {
          status: 'graded',
          label: 'Graded',
          color: 'bg-brand-green-100 text-brand-green-700',
          icon: CheckCircle,
        };
      }
      return {
        status: 'submitted',
        label: 'Submitted',
        color: 'bg-brand-blue-100 text-brand-blue-700',
        icon: CheckCircle,
      };
    }
    if (dueDate < now) {
      return {
        status: 'overdue',
        label: 'Overdue',
        color: 'bg-brand-red-100 text-brand-red-700',
        icon: AlertCircle,
      };
    }
    return {
      status: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getDaysUntilDue = (dateString: string) => {
    const now = new Date();
    const due = new Date(dateString);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Assignments</h1>
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
