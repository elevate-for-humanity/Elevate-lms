import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import TransitionButtons from './TransitionButtons';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Application Details | Elevate For Humanity',
  description: 'View application details',
};

const stateLabels: Record<string, string> = {
  started: 'Started',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  eligibility_complete: 'Eligibility Complete',
  documents_complete: 'Documents Complete',
  review_ready: 'Ready for Review',
};

const stateColors: Record<string, string> = {
  started: 'bg-gray-100 text-gray-800 border-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  submitted: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
  rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
  in_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  eligibility_complete: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  documents_complete: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  review_ready: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const typeLabels: Record<string, string> = {
  student: 'Student Application',
  partner: 'Partner Application',
  employer: 'Employer Application',
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Query from the unified view
  const { data: application, error } = await db
    .from('admin_applications_queue')
    .select('*')
    .eq('application_type', type)
    .eq('application_id', id)
    .single();

  if (error || !application) {
    notFound();
  }

  const intake = application.intake || {};
  const firstName = intake.first_name || '';
  const lastName = intake.last_name || '';
  const email = intake.email || '';
  const phone = intake.phone || '';
  const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown Applicant';

  // Fetch state events if available
  const { data: stateEvents } = await db
    .from('application_state_events')
    .select('id, from_state, to_state, actor_id, actor_role, reason, created_at')
    .eq('application_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-applications-id-hero.jpg" alt="Application review" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Applications', href: '/admin/applications' },
            { label: displayName },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                {typeLabels[type] || type}
              </span>
            </div>
            <p className="text-gray-600">{email}</p>
          </div>
          <div className="flex gap-3">
            <span
              className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${stateColors[application.state] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
            >
              {stateLabels[application.state] || application.state}
            </span>
            <Link
              href="/admin/applications"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Back to List
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{email || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{phone || 'Not provided'}</dd>
                </div>
              </dl>
            </div>

            {/* All Intake Data */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Data</h2>
              <dl className="grid grid-cols-2 gap-4">
                {Object.entries(intake).map(([key, value]) => {
                  if (key === 'first_name' || key === 'last_name' || key === 'email' || key === 'phone') {
                    return null; // Already shown above
                  }
                  return (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value || 'Not provided')}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <TransitionButtons
                applicationType={type}
                applicationId={id}
                currentState={application.state}
              />
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900">{typeLabels[type] || type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current State</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stateColors[application.state] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {stateLabels[application.state] || application.state}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(application.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {application.state_updated_at ? new Date(application.state_updated_at).toLocaleString() : '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* State History */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">State History</h2>
              {stateEvents && stateEvents.length > 0 ? (
                <div className="space-y-4">
                  {stateEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="relative pl-4 border-l-2 border-gray-200 pb-4 last:pb-0"
                    >
                      <div
                        className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full ${
                          index === stateEvents.length - 1
                            ? 'bg-brand-blue-600'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div className="text-sm">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${stateColors[event.to_state] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {stateLabels[event.to_state] || event.to_state}
                        </span>
                        <p className="text-gray-500 mt-1 text-xs">
                          {event.reason || 'State changed'} - {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.actor_role && (
                          <p className="text-gray-400 text-xs">by {event.actor_role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No state history available.</p>
              )}
            </div>

            {/* Application ID */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Application ID</h2>
              <p className="text-xs font-mono text-gray-600 break-all">{id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
