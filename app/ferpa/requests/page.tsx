import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Plus,
  Clock,
  XCircle,
  AlertCircle,
  User,
  FileText,
  Calendar,
  Filter,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Access Requests | FERPA Portal',
  description: 'Manage FERPA records access requests.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface FerpaRequest {
  id: string;
  request_type: string;
  requester_name: string;
  requester_email: string;
  requester_relationship: string | null;
  student_name: string | null;
  student_email: string | null;
  purpose: string;
  status: string;
  priority quality={90}: string;
  due_date: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  student_access: 'Student Access',
  parent_access: 'Parent/Guardian Access',
  third_party: 'Third Party Disclosure',
  transcript: 'Transcript Request',
  verification: 'Enrollment Verification',
  subpoena: 'Legal/Subpoena',
  directory_opt_out: 'Directory Opt-Out',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-brand-blue-100 text-brand-blue-800', icon: AlertCircle },
  approved: { label: 'Approved', color: 'bg-brand-green-100 text-brand-green-800', icon: CheckCircle },
  partially_approved: { label: 'Partially Approved', color: 'bg-brand-orange-100 text-brand-orange-800', icon: AlertCircle },
  denied: { label: 'Denied', color: 'bg-brand-red-100 text-brand-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

export default async function FerpaRequestsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed. Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/ferpa/requests');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Fetch requests
  const { data: requests, error } = await supabase
    .from('ferpa_access_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching FERPA requests:', error);
  }

  // Get counts by status
  const pendingCount = (requests as FerpaRequest[] | null)?.filter(r => r.status === 'pending').length || 0;
  const reviewCount = (requests as FerpaRequest[] | null)?.filter(r => r.status === 'under_review').length || 0;
  const overdueCount = (requests as FerpaRequest[] | null)?.filter(r => 
    r.due_date && new Date(r.due_date) < new Date() && !['completed', 'cancelled', 'denied'].includes(r.status)
  ).length || 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (request: FerpaRequest) => {
    if (!request.due_date) return false;
    if (['completed', 'cancelled', 'denied'].includes(request.status)) return false;
    return new Date(request.due_date) < new Date();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Access Requests</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
              <p className="text-gray-600 mt-1">
                Manage records access and disclosure requests
              </p>
            </div>
            <Link
              href="/ferpa/requests/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Request
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{reviewCount}</p>
                <p className="text-sm text-gray-500">Under Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-brand-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{overdueCount}</p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(requests?.length || 0) - pendingCount - reviewCount}</p>
                <p className="text-sm text-gray-500">Processed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Requests</h2>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {requests && requests.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {(requests as FerpaRequest[]).map((request) => {
                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const overdue = isOverdue(request);

                return (
                  <div key={request.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          overdue ? 'bg-brand-red-100' : 'bg-gray-100'
                        }`}>
                          <FileText className={`w-5 h-5 ${overdue ? 'text-brand-red-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {REQUEST_TYPE_LABELS[request.request_type] || request.request_type}
                            </h3>
                            {overdue && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-brand-red-100 text-brand-red-700 rounded">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {request.requester_name}
                            </span>
                            {request.student_name && (
                              <span>Student: {request.student_name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Created: {formatDate(request.created_at)}</span>
                            {request.due_date && (
                              <span className={overdue ? 'text-brand-red-600 font-medium' : ''}>
                                Due: {formatDate(request.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <Link
                          href={`/ferpa/requests/${request.id}`}
                          className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No access requests found</p>
              <Link
                href="/ferpa/requests/new"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium mt-2 inline-block"
              >
                Create the first request
              </Link>
            </div>
          )}
        </div>

        {/* FERPA Timeline Notice */}
        <div className="mt-8 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-brand-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-brand-blue-800">FERPA Response Timeline</h3>
              <p className="text-sm text-brand-blue-700 mt-1">
                Under FERPA, institutions must respond to records access requests within 45 days.
                Requests approaching or past their due date are highlighted for priority quality={90} handling.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
