import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Clock,
  MapPin,
  Edit,
  MessageSquare,
  FileText,
  AlertCircle,
  Target,
CheckCircle, } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Learner Profile | Case Management',
    robots: { index: false, follow: false },
  };
}

export default async function CMLearnerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify case manager access
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['case_manager', 'admin', 'staff'].includes(profile?.role || '')) {
    redirect('/unauthorized');
  }

  // Fetch learner
  const { data: learner, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !learner) notFound();

  // Fetch enrollments
  const { data: enrollments } = await db
    .from('enrollments')
    .select(`
      *,
      courses (id, title),
      programs (id, name)
    `)
    .eq('user_id', id)
    .order('enrolled_at', { ascending: false });

  // Fetch case notes
  const { data: caseNotes } = await db
    .from('case_notes')
    .select(`
      *,
      profiles:created_by (first_name, last_name)
    `)
    .eq('learner_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch goals
  const { data: goals } = await db
    .from('learner_goals')
    .select('*')
    .eq('learner_id', id)
    .order('created_at', { ascending: false });

  // Fetch documents
  const { data: documents } = await db
    .from('learner_documents')
    .select('*')
    .eq('learner_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
  const completedGoals = goals?.filter(g => g.status === 'completed').length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/cm/learners"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learners
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
              {learner.avatar_url ? (
                <Image src={learner.avatar_url} alt={`${learner.first_name} ${learner.last_name}`} width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-brand-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {learner.first_name} {learner.last_name}
              </h1>
              <p className="text-slate-600">{learner.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  learner.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {learner.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/cm/learners/${id}/message`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <MessageSquare className="w-4 h-4" />
              Message
            </Link>
            <Link
              href={`/cm/learners/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeEnrollments}</p>
              <p className="text-sm text-slate-600">Active Programs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-brand-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedGoals}</p>
              <p className="text-sm text-slate-600">Goals Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{caseNotes?.length || 0}</p>
              <p className="text-sm text-slate-600">Case Notes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{documents?.length || 0}</p>
              <p className="text-sm text-slate-600">Documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goals */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Goals & Milestones</h2>
              <Link href={`/cm/learners/${id}/goals`} className="text-sm text-brand-blue-600 hover:underline">
                Manage Goals
              </Link>
            </div>
            {goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.slice(0, 5).map((goal: any) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        goal.status === 'completed' ? 'bg-brand-green-100' : 'bg-yellow-100'
                      }`}>
                        {goal.status === 'completed' ? (
                          <span className="text-slate-400 flex-shrink-0">•</span>
                        ) : (
                          <Target className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{goal.title}</p>
                        <p className="text-sm text-slate-600">
                          Due: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'No deadline'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'completed' ? 'bg-brand-green-100 text-brand-green-800' :
                      goal.status === 'in_progress' ? 'bg-brand-blue-100 text-brand-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {goal.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No goals set</p>
            )}
          </div>

          {/* Case Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Case Notes</h2>
              <Link href={`/cm/learners/${id}/notes`} className="text-sm text-brand-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {caseNotes && caseNotes.length > 0 ? (
              <div className="space-y-4">
                {caseNotes.map((note: any) => (
                  <div key={note.id} className="p-4 border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">
                        {note.profiles?.first_name} {note.profiles?.last_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700">{note.content}</p>
                    {note.type && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {note.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No case notes</p>
            )}
            <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <FileText className="w-4 h-4" />
              Add Case Note
            </button>
          </div>

          {/* Enrollments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Program Enrollments</h2>
            </div>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">
                        {enrollment.programs?.name || enrollment.courses?.title || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-600">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{enrollment.progress || 0}%</p>
                      <span className={`text-xs ${
                        enrollment.status === 'completed' ? 'text-brand-green-600' :
                        enrollment.status === 'active' ? 'text-brand-blue-600' : 'text-slate-500'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No enrollments</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="text-slate-900">{learner.email}</p>
                </div>
              </div>
              {learner.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="text-slate-900">{learner.phone}</p>
                  </div>
                </div>
              )}
              {(learner.city || learner.state) && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="text-slate-900">
                      {[learner.city, learner.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600">Member Since</p>
                  <p className="text-slate-900">
                    {new Date(learner.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
              <Link href={`/cm/learners/${id}/documents`} className="text-sm text-brand-blue-600 hover:underline">
                View All
              </Link>
            </div>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-slate-500" />
                    <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No documents uploaded</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/cm/learners/${id}/assessment`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <Target className="w-5 h-5 text-slate-500" />
                <span>Run Assessment</span>
              </Link>
              <Link
                href={`/cm/learners/${id}/enroll`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <BookOpen className="w-5 h-5 text-slate-500" />
                <span>Enroll in Program</span>
              </Link>
              <Link
                href={`/cm/learners/${id}/schedule`}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg"
              >
                <Calendar className="w-5 h-5 text-slate-500" />
                <span>Schedule Meeting</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
