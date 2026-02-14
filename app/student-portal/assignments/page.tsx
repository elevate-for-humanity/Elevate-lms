import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { FileText, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Assignments | Student Portal',
  description: 'View and submit your assignments.',
};

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?next=/student-portal/assignments');

  // Fetch assignments from database
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      description,
      due_date,
      status,
      grade,
      max_points,
      submitted_at,
      course:courses(name)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching assignments:', error.message);
  }

  const assignmentList = (assignments || []).map((a: any) => ({
    id: a.id,
    title: a.title || 'Assignment',
    description: a.description || '',
    dueDate: a.due_date,
    status: a.status || 'pending',
    grade: a.grade,
    maxPoints: a.max_points || 100,
    submittedAt: a.submitted_at,
    courseName: a.course?.name || 'Course',
  }));

  const pendingCount = assignmentList.filter(a => a.status === 'pending').length;
  const submittedCount = assignmentList.filter(a => a.status === 'submitted').length;
  const gradedCount = assignmentList.filter(a => a.status === 'graded').length;

  const getStatusConfig = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
    
    if (isOverdue) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle };
    }
    
    switch (status) {
      case 'submitted':
        return { label: 'Submitted', color: 'bg-brand-blue-100 text-brand-blue-700', icon: Clock };
      case 'graded':
        return { label: 'Graded', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      default:
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Track and submit your coursework</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-brand-blue-600">{submittedCount}</p>
            <p className="text-sm text-gray-500">Submitted</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
            <p className="text-sm text-gray-500">Graded</p>
          </div>
        </div>

        {/* Assignments List */}
        {assignmentList.length > 0 ? (
          <div className="space-y-4">
            {assignmentList.map((assignment) => {
              const statusConfig = getStatusConfig(assignment.status, assignment.dueDate);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={assignment.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">{assignment.courseName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          {assignment.status === 'graded' && (
                            <span className="font-medium text-gray-900">
                              Grade: {assignment.grade}/{assignment.maxPoints}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      {assignment.status === 'pending' && (
                        <Link
                          href={`/student-portal/assignments/${assignment.id}`}
                          className="px-3 py-1 bg-brand-blue-600 text-white text-sm rounded-lg hover:bg-brand-blue-700"
                        >
                          Submit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No assignments</h2>
            <p className="text-gray-600 mb-6">You don't have any assignments yet.</p>
            <Link href="/student-portal/courses" className="text-brand-blue-600 hover:underline">
              View your courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
