import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Key,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Users,
  BookOpen,
  Activity,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'LMS Integration Details | Partners | Admin',
    robots: { index: false, follow: false },
  };
}

export default async function LMSIntegrationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch LMS provider
  const { data: provider, error } = await supabase
    .from('partner_lms_providers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !provider) {
    notFound();
  }

  // Fetch courses from this provider
  const { data: courses, count: courseCount } = await supabase
    .from('partner_lms_courses')
    .select('*', { count: 'exact' })
    .eq('provider_id', id)
    .order('course_name');

  // Fetch enrollments count
  const { count: enrollmentCount } = await supabase
    .from('partner_lms_enrollments')
    .select('*', { count: 'exact', head: true })
    .in('course_id', courses?.map(c => c.id) || []);

  // Fetch recent sync logs
  const { data: syncLogs } = await supabase
    .from('partner_lms_sync_logs')
    .select('*')
    .eq('provider_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/partners/lms-integrations"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to LMS Integrations
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              {provider.logo_url ? (
                <img src={provider.logo_url} alt={`${provider.provider_name} logo`} className="w-12 h-12 object-contain" />
              ) : (
                <Globe className="w-8 h-8 text-brand-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{provider.provider_name}</h1>
              <p className="text-slate-600">{provider.provider_type || 'LMS Provider'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[provider.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {provider.status === 'active' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {provider.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
            <Link
              href={`/admin/partners/lms-integrations/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <Edit className="w-4 h-4" />
              Edit
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
              <p className="text-2xl font-bold text-slate-900">{courseCount || 0}</p>
              <p className="text-sm text-slate-600">Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{enrollmentCount || 0}</p>
              <p className="text-sm text-slate-600">Enrollments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {provider.last_sync ? 'Active' : 'Never'}
              </p>
              <p className="text-sm text-slate-600">Last Sync</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {syncLogs?.filter(l => l.status === 'error').length || 0}
              </p>
              <p className="text-sm text-slate-600">Sync Errors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Courses */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Courses</h2>
              <Link
                href={`/admin/partners/lms-integrations/${id}/courses`}
                className="text-sm text-brand-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            {courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course: any) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{course.course_name}</p>
                      <p className="text-sm text-slate-600">
                        {course.hours ? `${course.hours} hours` : 'Duration not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.active ? 'Active' : 'Inactive'}
                      </span>
                      {course.course_url && (
                        <a
                          href={course.course_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-500 hover:text-brand-blue-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No courses configured</p>
            )}
          </div>

          {/* Sync History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sync History</h2>
            {syncLogs && syncLogs.length > 0 ? (
              <div className="space-y-3">
                {syncLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        log.status === 'success' ? 'bg-green-100' :
                        log.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {log.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : log.status === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{log.sync_type || 'Full Sync'}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-900">
                        {log.records_synced || 0} records
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-red-600 truncate max-w-[200px]">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No sync history</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Connection Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Connection Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">API Endpoint</p>
                  <p className="text-slate-900 truncate">{provider.api_url || 'Not configured'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600">API Key</p>
                  <p className="text-slate-900">
                    {provider.api_key ? '••••••••' + provider.api_key.slice(-4) : 'Not configured'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-600">Sync Frequency</p>
                  <p className="text-slate-900">{provider.sync_frequency || 'Manual'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-slate-700">Auto-sync enabled</span>
                <input
                  type="checkbox"
                  defaultChecked={provider.auto_sync}
                  className="w-4 h-4 text-brand-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-slate-700">Send completion notifications</span>
                <input
                  type="checkbox"
                  defaultChecked={provider.send_notifications}
                  className="w-4 h-4 text-brand-blue-600 rounded"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-slate-700">Track progress</span>
                <input
                  type="checkbox"
                  defaultChecked={provider.track_progress !== false}
                  className="w-4 h-4 text-brand-blue-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
            <p className="text-sm text-slate-600 mb-4">
              Removing this integration will disconnect all courses and enrollments.
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              <Trash2 className="w-4 h-4" />
              Remove Integration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
