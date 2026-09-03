'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Clock, Phone, Search, XCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'pending'
  | 'pending_funding'
  | 'pending_admin_review'
  | 'contacted'
  | 'approved'
  | 'enrolled'
  | 'rejected'
  | 'withdrawn';

type TrackedApplication = {
  id: string;
  first_name?: string;
  program_interest?: string;
  program_id?: string;
  reference_number?: string;
  status: ApplicationStatus | string;
  submitted_at: string;
};

type StatusPresentation = {
  icon: typeof Clock;
  color: string;
  bg: string;
  border: string;
  label: string;
  description: string;
};

const pendingStatus: StatusPresentation = {
  icon: Clock,
  color: 'text-amber-700',
  bg: 'bg-amber-50',
  border: 'border-amber-200',
  label: 'Under Review',
  description: 'Your application has been received and is being reviewed.',
};

const statusConfig: Record<string, StatusPresentation> = {
  submitted: pendingStatus,
  under_review: pendingStatus,
  pending: pendingStatus,
  pending_funding: {
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Funding Action Required',
    description: 'Your application is waiting on a required funding or authorization step.',
  },
  pending_admin_review: {
    icon: Clock,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Pending Enrollment Review',
    description: 'Your application is awaiting final enrollment review.',
  },
  contacted: {
    icon: Phone,
    color: 'text-brand-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Contacted',
    description: 'An advisor has reached out. Check the contact information you provided with your application.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Approved',
    description: 'Your application has been approved. Complete any remaining enrollment requirements.',
  },
  enrolled: {
    icon: CheckCircle,
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Enrolled',
    description: 'Your enrollment is active. Sign in to continue onboarding and training.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Not Approved',
    description: 'The application cannot proceed in its current form. Contact admissions if you need clarification.',
  },
  withdrawn: {
    icon: XCircle,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'Withdrawn',
    description: 'This application has been withdrawn and is no longer active.',
  },
};

const unknownStatus: StatusPresentation = {
  icon: Clock,
  color: 'text-slate-700',
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  label: 'Status Update',
  description: 'Your application has a workflow update. Contact admissions if you need clarification.',
};

export default function TrackApplicationPage() {
  const [searchId, setSearchId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [application, setApplication] = useState<TrackedApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (id?: string, email?: string) => {
    const applicationId = (id ?? searchId).trim();
    const applicationEmail = (email ?? searchEmail).trim();

    if (!applicationId || !applicationEmail) {
      setError('Enter both your Application ID and the email address used on the application.');
      return;
    }

    setLoading(true);
    setError('');
    setApplication(null);

    try {
      const params = new URLSearchParams({ id: applicationId, email: applicationEmail });
      const response = await fetch(`/api/applications/track?${params.toString()}`);
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'We could not verify those application details. Check both entries and try again.'
            : body?.error || 'Unable to retrieve application status.',
        );
      }

      setApplication(body.application ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retrieve application status.');
    } finally {
      setLoading(false);
    }
  }, [searchEmail, searchId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || '';
    const email = params.get('email') || '';
    if (id) setSearchId(id);
    if (email) setSearchEmail(email);
    if (id && email) void handleSearch(id, email);
  }, [handleSearch]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSearch();
  };

  const status = application ? statusConfig[application.status] ?? unknownStatus : null;
  const StatusIcon = status?.icon;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Track' }]} />
        </div>
      </div>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Track Your Application</h1>
          <p className="mt-4 text-lg text-slate-700">
            For privacy, status lookup requires both your Application ID or reference number and the email address used on the application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label htmlFor="applicationId" className="block text-sm font-bold text-slate-900">Application ID or reference number</label>
            <input
              id="applicationId"
              required
              autoComplete="off"
              value={searchId}
              onChange={(event) => setSearchId(event.target.value)}
              placeholder="EFH-XXXXX or application UUID"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-900">Application email address</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={searchEmail}
              onChange={(event) => setSearchEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-brand-blue-200"
            />
          </div>

          {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
            {loading ? 'Checking…' : 'Track Application'}
          </button>
        </form>

        {application && status && StatusIcon ? (
          <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-live="polite">
            <div className={`rounded-xl border p-5 ${status.bg} ${status.border}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`mt-0.5 h-7 w-7 shrink-0 ${status.color}`} aria-hidden="true" />
                <div>
                  <h2 className={`text-2xl font-black ${status.color}`}>{status.label}</h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-800">{status.description}</p>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              {application.first_name ? <div><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Applicant</dt><dd className="mt-1 font-bold text-slate-950">{application.first_name}</dd></div> : null}
              <div><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Application</dt><dd className="mt-1 break-all font-mono text-sm font-bold text-slate-950">{application.reference_number || application.id}</dd></div>
              {(application.program_interest || application.program_id) ? <div><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Program</dt><dd className="mt-1 font-bold text-slate-950">{application.program_interest || application.program_id}</dd></div> : null}
              <div><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Submitted</dt><dd className="mt-1 font-bold text-slate-950">{new Date(application.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd></div>
            </dl>

            <div className="mt-6 border-t border-slate-200 pt-5 text-sm text-slate-700">
              Need help interpreting this status? <Link href="/contact" className="font-black text-brand-blue-700 hover:underline">Contact admissions</Link> or call {PLATFORM_DEFAULTS.supportPhone}.
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
