export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Users, Clock, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Assignments | Instructor',
  description: 'Manage and grade course assignments.',
};

type Params = Promise<{ courseId: string }>;

export default async function InstructorAssignmentsPage({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Service Unavailable</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single();

  // Fetch assignments for this course
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, max_points, due_date, created_at')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });

  // Get submission counts per assignment
  const assignmentIds = (assignments || []).map((a: any) => a.id);
  const { data: submissionCounts } = assignmentIds.length > 0
    ? await supabase
        .from('assignment_submissions')
        .select('assignment_id')
        .in('assignment_id', assignmentIds)
    : { data: [] };

  const countMap = new Map<string, number>();
  (submissionCounts || []).forEach((s: any) => {
    countMap.set(s.assignment_id, (countMap.get(s.assignment_id) || 0) + 1);
  });

  // Get graded counts
  const { data: gradedCounts } = assignmentIds.length > 0
    ? await supabase
        .from('grades')
        .select('assignment_id')
        .in('assignment_id', assignmentIds)
    : { data: [] };

  const gradedMap = new Map<string, number>();
  (gradedCounts || []).forEach((g: any) => {
    gradedMap.set(g.assignment_id, (gradedMap.get(g.assignment_id) || 0) + 1);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm mb-4">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/instructor" className="hover:text-brand-blue-600">Instructor</Link></li>
            <li>/</li>
            <li><Link href="/instructor/courses" className="hover:text-brand-blue-600">Courses</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Assignments</li>
          </ol>
        </nav>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {course?.title} — Assignments
            </h1>
            <p className="text-gray-600 mt-1">
              {assignments?.length || 0} assignment{(assignments?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href={`/instructor/courses/${courseId}/gradebook`}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            View Gradebook
          </Link>
        </div>

        {assignments && assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assignment: any) => {
              const totalSubmissions = countMap.get(assignment.id) || 0;
              const totalGraded = gradedMap.get(assignment.id) || 0;
              const needsGrading = totalSubmissions - totalGraded;
              const isPastDue = assignment.due_date && new Date(assignment.due_date) < new Date();

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-brand-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-900">
                          {assignment.title}
                        </h2>
                        {needsGrading > 0 && (
                          <span className="bg-brand-orange-100 text-brand-orange-700 text-xs font-semibold px-2 py-1 rounded-full">
                            {needsGrading} to grade
                          </span>
                        )}
                      </div>

                      {assignment.description && (
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          {assignment.max_points || 100} pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          {totalGraded} graded
                        </span>
                        {assignment.due_date && (
                          <span className={`flex items-center gap-1 ${isPastDue ? 'text-brand-red-500' : ''}`}>
                            <Clock className="w-4 h-4" />
                            Due {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/instructor/courses/${courseId}/assignments/${assignment.id}/grade`}
                      className="flex items-center gap-2 bg-brand-orange-600 text-white px-4 py-2 rounded-lg hover:bg-brand-orange-700 text-sm font-medium whitespace-nowrap"
                    >
                      SpeedGrader
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No assignments created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
