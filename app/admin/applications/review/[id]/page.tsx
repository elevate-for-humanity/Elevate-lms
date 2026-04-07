import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import ApplicationActions from './ApplicationActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review Application | Elevate For Humanity',
  description: 'Review and approve or reject an application',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  in_review: 'In Review',
  enrolled: 'Enrolled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  submitted: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
  rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
  in_review: 'bg-brand-blue-100 text-brand-blue-800 border-brand-blue-300',
  enrolled: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  // revoked is a derived state (revoked_at IS NOT NULL), not a DB status value
  revoked: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
};

export default async function ReviewApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();


  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Use admin client — applications table RLS restricts session-based reads.
  // Auth check above already confirmed the caller is admin/super_admin.
  const db = createAdminClient();
  const { data: app, error } = await db
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !app) notFound();

  const displayName =
    [app.first_name, app.last_name].filter(Boolean).join(' ') ||
    app.full_name ||
    'Unknown Applicant';

  // Effective status: revoked_at IS NOT NULL overrides the DB status value.
  // applications.status stays 'enrolled' (terminal) after revocation.
  const effectiveStatus = app.revoked_at ? 'revoked' : app.status;

  // Resolve program_interest slug to a training_courses ID for enrollment creation
  const programSlug = (app.program_interest || '') as string;
  let resolvedProgramId: string | null = null;
  if (programSlug) {
    // Try exact match on slug-like patterns in title
    const searchTerm = programSlug.replace(/-/g, ' ');
    const { data: matchedCourse } = await db
      .from('courses')
      .select('id, title')
      .ilike('title', `%${searchTerm}%`)
      .eq('is_active', true)
      .limit(1)
      .single();
    resolvedProgramId = matchedCourse?.id || null;
  }

  // Parse support_notes for structured data
  const notes = (app.support_notes || '') as string;
  const noteFields = notes.split(' | ').filter(Boolean);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
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
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${statusColors[effectiveStatus] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
              >
                {effectiveStatus === 'revoked' ? 'Revoked' : (statusLabels[app.status] || app.status)}
              </span>
            </div>
            <p className="text-gray-600">{app.email}</p>
          </div>
          <Link
            href="/admin/applications"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Back to List
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="text-sm text-gray-900">{displayName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">
                    <a href={`mailto:${app.email}`} className="text-brand-blue-600 hover:underline">
                      {app.email || 'Not provided'}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">
                    {app.phone ? (
                      <a href={`tel:${app.phone}`} className="text-brand-blue-600 hover:underline">
                        {app.phone}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="text-sm text-gray-900">
                    {app.city || 'N/A'}
                    {app.zip ? `, ${app.zip}` : ''}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Program Interest */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Interest</h2>
              <p className="text-gray-900 font-medium">
                {app.program_interest || 'Not specified'}
              </p>
              {app.source && (
                <p className="text-sm text-gray-500 mt-1">
                  Source: {(app.source as string).replace(/-/g, ' ')}
                </p>
              )}
            </div>

            {/* Additional Details */}
            {noteFields.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
                <dl className="space-y-3">
                  {noteFields.map((field, i) => {
                    const [label, ...rest] = field.split(': ');
                    const value = rest.join(': ');
                    return (
                      <div key={i}>
                        <dt className="text-sm font-medium text-gray-500">{label}</dt>
                        <dd className="text-sm text-gray-900">{value || field}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <ApplicationActions
                applicationId={id}
                currentStatus={app.status}
                programId={resolvedProgramId}
                programInterest={programSlug}
              />
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Application ID</dt>
                  <dd className="text-xs font-mono text-gray-600 break-all">{id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(app.created_at).toLocaleString('en-US')}
                  </dd>
                </div>
                {app.updated_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(app.updated_at).toLocaleString('en-US')}
                    </dd>
                  </div>
                )}
                {app.revoked_at && (
                  <div className="pt-2 border-t border-red-200">
                    <dt className="text-sm font-medium text-brand-red-600">Revoked</dt>
                    <dd className="text-sm text-brand-red-700">
                      {new Date(app.revoked_at).toLocaleString('en-US')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
