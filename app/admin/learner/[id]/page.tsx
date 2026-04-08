import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
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
  MoreHorizontal,
  XCircle,
  AlertCircle,
CheckCircle, } from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Learner Details | Admin | Elevate for Humanity',
    robots: { index: false, follow: false },
  };
}

export default async function LearnerDetailPage({ params }: Props) {
  await requireRole(['admin', 'super_admin']);
  const { id } = await params;
  const supabase = await createClient();




  // Fetch learner profile
  const { data: learner, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !learner) {
    notFound();
  }

  // Fetch enrollments
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      programs (id, title, slug, thumbnail_url)
    `)
    .eq('user_id', id)
    .order('enrolled_at', { ascending: false });

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', id)
    .order('issued_at', { ascending: false });

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('lesson_progress')
    .select(`
      *,
      lessons (title)
    `)
    .eq('user_id', id)
    .order('updated_at', { ascending: false })
    .limit(10);

  const completedCourses = enrollments?.filter(e => e.progress === 100).length || 0;
  const activeCourses = enrollments?.filter(e => e.status === 'active' && e.progress < 100).length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Hero Image */}
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
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
                  learner.status === 'active' 
                    ? 'bg-brand-green-100 text-brand-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {learner.status || 'Active'}
                </span>
                <span className="text-xs text-slate-500">
                  Joined {new Date(learner.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/learner/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <MoreHorizontal className="w-5 h-5" />
            </button>
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
              <p className="text-2xl font-bold text-slate-900">{enrollments?.length || 0}</p>
              <p className="text-sm text-slate-600">Total Enrollments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completedCourses}</p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCourses}</p>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{certificates?.length || 0}</p>
              <p className="text-sm text-slate-600">Certificates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollments */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Course Enrollments</h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {enrollment.programs?.title || 'Unknown Program'}
                        </p>
                        <p className="text-sm text-slate-600">
                          Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-blue-600 rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {enrollment.progress || 0}%
                        </span>
                      </div>
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
              <p className="text-slate-500 text-center py-4">No enrollments found</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.completed ? 'bg-brand-green-100' : 'bg-brand-blue-100'
                    }`}>
                      {activity.completed ? (
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      ) : (
                        <Clock className="w-4 h-4 text-brand-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900">
                        {activity.completed ? 'Completed' : 'Started'} {activity.lessons?.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No recent activity</p>
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

          {/* Certificates */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Certificates</h2>
            {certificates && certificates.length > 0 ? (
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div key={cert.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{cert.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No certificates yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
