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
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Edit,
  FileText,
  Award,
} from 'lucide-react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Employee Details | HR | Admin',
    robots: { index: false, follow: false },
  };
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  const { data: adminProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch employee
  const { data: employee, error } = await db
    .from('employees')
    .select(`
      *,
      profiles (id, first_name, last_name, email, phone, avatar_url),
      departments (id, name),
      managers:employees!employees_manager_id_fkey (
        profiles (first_name, last_name)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !employee) {
    notFound();
  }

  // Fetch time off requests
  const { data: timeOffRequests } = await db
    .from('time_off_requests')
    .select('*')
    .eq('employee_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch performance reviews
  const { data: reviews } = await db
    .from('performance_reviews')
    .select('*')
    .eq('employee_id', id)
    .order('review_date', { ascending: false })
    .limit(3);

  const profile = employee.profiles as any;
  const department = employee.departments as any;
  const manager = employee.managers?.profiles as any;

  const statusColors: Record<string, string> = {
    active: 'bg-brand-green-100 text-brand-green-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    terminated: 'bg-brand-red-100 text-brand-red-800',
    probation: 'bg-brand-blue-100 text-brand-blue-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/hr/employees"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt={`${profile?.first_name} ${profile?.last_name}`} width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-brand-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-slate-600">{employee.job_title || 'Employee'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[employee.status] || 'bg-gray-100 text-gray-800'
                }`}>
                  {employee.status?.replace('_', ' ') || 'Active'}
                </span>
                {department && (
                  <span className="text-xs text-slate-500">{department.name}</span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/admin/hr/employees/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <Edit className="w-4 h-4" />
            Edit Employee
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Employment Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Job Title</p>
                  <p className="font-medium text-slate-900">{employee.job_title || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-brand-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Start Date</p>
                  <p className="font-medium text-slate-900">
                    {employee.start_date ? new Date(employee.start_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Employment Type</p>
                  <p className="font-medium text-slate-900">{employee.employment_type || 'Full-time'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Reports To</p>
                  <p className="font-medium text-slate-900">
                    {manager ? `${manager.first_name} ${manager.last_name}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Off */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Time Off Requests</h2>
              <Link
                href={`/admin/hr/time-off?employee=${id}`}
                className="text-sm text-brand-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            {timeOffRequests && timeOffRequests.length > 0 ? (
              <div className="space-y-3">
                {timeOffRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{request.type}</p>
                      <p className="text-sm text-slate-600">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'approved' ? 'bg-brand-green-100 text-brand-green-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-brand-red-100 text-brand-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No time off requests</p>
            )}
          </div>

          {/* Performance Reviews */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Performance Reviews</h2>
              <Link
                href={`/admin/hr/performance?employee=${id}`}
                className="text-sm text-brand-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-slate-900">{review.review_period}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(review.review_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{review.rating}/5</p>
                      <p className="text-xs text-slate-500">Rating</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No performance reviews</p>
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
                  <p className="text-slate-900">{profile?.email || 'N/A'}</p>
                </div>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Phone</p>
                    <p className="text-slate-900">{profile.phone}</p>
                  </div>
                </div>
              )}
              {employee.work_location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-600">Work Location</p>
                    <p className="text-slate-900">{employee.work_location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Compensation</h2>
            <div className="space-y-4">
              {employee.salary && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-brand-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Annual Salary</p>
                    <p className="text-xl font-bold text-slate-900">
                      ${employee.salary.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Benefits</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-800 rounded text-xs">Health Insurance</span>
                  <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-800 rounded text-xs">401(k)</span>
                  <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-800 rounded text-xs">PTO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Documents</h2>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">Employment Contract</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">W-4 Form</span>
              </button>
              <button className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left">
                <FileText className="w-5 h-5 text-slate-500" />
                <span className="text-slate-700">I-9 Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
