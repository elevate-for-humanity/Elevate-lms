import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Clock, AlertCircle, Calendar, Upload, ChevronRight, Filter, BookOpen, CheckCircle, } from 'lucide-react';
import AssignmentSubmission from '@/components/AssignmentSubmission';

export const metadata: Metadata = {
  title: 'My Assignments | Student Portal',
  description: 'View and submit your course assignments, track deadlines, and check submission status.',
};

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Assignments" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let assignments: any[] = [];
  let submissions: any[] = [];
  const stats = { pending: 0, submitted: 0, graded: 0, overdue: 0 };

  try {
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const courseIds = enrollments?.map(e => e.course_id) || [];

    if (courseIds.length > 0) {
      const { data: assignmentData } = await db
        .from('assignments')
        .select('*, courses (id, title)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true });

      if (assignmentData) {
        assignments = assignmentData;
      }

      const { data: submissionData } = await db
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user.id);

      if (submissionData) {
        submissions = submissionData;
      }
    }

    const now = new Date();
    assignments.forEach(assignment => {
      const submission = submissions.find(s => s.assignment_id === assignment.id);
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
    // Assignment data fetch failed — tables may not exist yet
  }

  const getSubmissionStatus = (assignment: any) => {
    const submission = submissions.find(s => s.assignment_id === assignment.id);
    const now = new Date();
    const dueDate = new Date(assignment.due_date);

    if (submission) {
      if (submission.grade !== null) {
        return { status: 'graded', label: 'Graded', color: 'bg-brand-green-100 text-brand-green-700', icon: CheckCircle };
      }
      return { status: 'submitted', label: 'Submitted', color: 'bg-brand-blue-100 text-brand-blue-700', icon: CheckCircle };
    }
    if (dueDate < now) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-brand-red-100 text-brand-red-700', icon: AlertCircle };
    }
    return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
    <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Assignments" }]} />
        </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Assignments</h1>
            <p className="text-slate-600 mt-1">Track your assignments, deadlines, and submissions</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-white transition">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.submitted}</div>
                <div className="text-sm text-slate-600">Submitted</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.graded}</div>
                <div className="text-sm text-slate-600">Graded</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
                <div className="text-sm text-slate-600">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">All Assignments</h2>
          </div>

          {assignments.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {assignments.map((assignment) => {
                const statusInfo = getSubmissionStatus(assignment);
                const submission = submissions.find(s => s.assignment_id === assignment.id);

                return (
                  <Link key={assignment.id} href={`/lms/assignments/${assignment.id}`} className="block p-6 hover:bg-white transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900 truncate">{assignment.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{assignment.courses?.title}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {formatDate(assignment.due_date)}</span>
                            </div>
                            <div className={`font-medium ${statusInfo.status === 'overdue' ? 'text-brand-red-600' : statusInfo.status === 'pending' ? 'text-brand-orange-600' : 'text-brand-green-600'}`}>
                              {getDaysUntilDue(assignment.due_date)}
                            </div>
                            {assignment.max_points && <div className="text-slate-500">{assignment.max_points} points</div>}
                          </div>
                          {submission?.grade !== null && submission?.grade !== undefined && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-brand-green-50 rounded-lg">
                              <span className="text-sm text-brand-green-700">Grade: <strong>{submission.grade}/{assignment.max_points || 100}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Assignments Yet</h3>
              <p className="text-slate-600 mb-6">Assignments from your enrolled courses will appear here.</p>
              <Link href="/learner/courses" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition">
                Browse Courses
              </Link>
            </div>
          )}
        </div>

        {/* Assignment Submission Widget */}
        <div className="mt-8">
          <AssignmentSubmission />
        </div>
      </div>
    </div>
  );
}
