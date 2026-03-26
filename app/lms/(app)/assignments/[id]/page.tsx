import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  AlertCircle,
  Download,
  BookOpen,
CheckCircle, } from 'lucide-react';
import AssignmentSubmitForm from '../AssignmentSubmitForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  
  if (!supabase) return { title: 'Assignment | Elevate LMS' };
  
  const { data: assignment } = await supabase
    .from('assignments')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: assignment ? `${assignment.title} | Elevate LMS` : 'Assignment | Elevate LMS',
  };
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/assignments/' + id);

  // Fetch assignment
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      *,
      courses (id, title)
    `)
    .eq('id', id)
    .single();

  if (error || !assignment) notFound();

  // Fetch user's submission
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', id)
    .eq('user_id', user.id)
    .single();

  const course = assignment.courses as { id: string; title: string } | null;
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const isSubmitted = !!submission;
  const isGraded = submission?.grade !== null && submission?.grade !== undefined;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/learner/assignments"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
                  {course && (
                    <Link
                      href={`/lms/courses/${course.id}`}
                      className="text-brand-blue-600 hover:underline text-sm"
                    >
                      {course.course_name}
                    </Link>
                  )}
                </div>
                {isSubmitted ? (
                  isGraded ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      Graded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Submitted
                    </span>
                  )
                ) : isOverdue ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-brand-red-100 text-brand-red-800 rounded-full text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Pending
                  </span>
                )}
              </div>

              {/* Due Date */}
              {assignment.due_date && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
                  isOverdue && !isSubmitted
                    ? 'bg-brand-red-50 text-brand-red-800'
                    : 'bg-white text-slate-700'
                }`}>
                  <Calendar className="w-5 h-5" />
                  <span>
                    Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* Description */}
              {assignment.description && (
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{assignment.description}</p>
                </div>
              )}

              {/* Attachments */}
              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {assignment.attachments.map((attachment: any, idx: number) => (
                      <a
                        key={idx}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-white"
                      >
                        <FileText className="w-5 h-5 text-slate-500" />
                        <span className="flex-1">{attachment.name}</span>
                        <Download className="w-4 h-4 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submission Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {isSubmitted ? 'Your Submission' : 'Submit Assignment'}
              </h2>

              {isSubmitted ? (
                <div className="space-y-4">
                  {/* Submission Details */}
                  <div className="p-4 bg-white rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Submitted on</p>
                    <p className="font-medium text-slate-900">
                      {new Date(submission.submitted_at).toLocaleString()}
                    </p>
                  </div>

                  {submission.content && (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Your Response</p>
                      <div className="p-4 bg-white rounded-lg whitespace-pre-wrap">
                        {submission.content}
                      </div>
                    </div>
                  )}

                  {submission.file_url && (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Uploaded File</p>
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-brand-blue-50 rounded-lg hover:bg-brand-blue-100"
                      >
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                        <span className="flex-1 text-brand-blue-700">View Submission</span>
                        <Download className="w-4 h-4 text-brand-blue-500" />
                      </a>
                    </div>
                  )}

                  {/* Grade */}
                  {isGraded && (
                    <div className="p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-brand-green-700">Grade</p>
                          <p className="text-2xl font-bold text-brand-green-800">
                            {submission.grade}/{assignment.max_points || 100}
                          </p>
                        </div>
                        {submission.feedback && (
                          <div className="flex-1 ml-6">
                            <p className="text-sm text-brand-green-700">Feedback</p>
                            <p className="text-brand-green-800">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <AssignmentSubmitForm assignmentId={id} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Assignment Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Type</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {assignment.type || 'Standard'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Points</p>
                    <p className="font-medium text-slate-900">
                      {assignment.max_points || 100} points
                    </p>
                  </div>
                </div>
                {assignment.attempts_allowed && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">Attempts</p>
                      <p className="font-medium text-slate-900">
                        {assignment.attempts_allowed} allowed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submission Guidelines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Submission Guidelines</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Submit before the due date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Accepted formats: PDF, DOC, DOCX</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Maximum file size: 10MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Include your name in the file</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
