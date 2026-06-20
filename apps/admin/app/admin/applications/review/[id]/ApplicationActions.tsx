'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Props {
  applicationId: string;
  currentStatus: string;
  programId: string | null;
  programInterest: string;
  applicantEmail: string;
  applicantName: string;
}

export default function ApplicationActions({
  applicationId,
  currentStatus,
  programId,
  programInterest,
  applicantEmail,
  applicantName,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleResendOnboarding = async () => {
    setLoading('resend');
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/resend-onboarding`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      setSuccess(`Onboarding email resent to ${data.email}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend onboarding email');
    } finally {
      setLoading(null);
    }
  };

  // Terminal states — show resend option for approved apps
  if (
    currentStatus === 'approved' ||
    currentStatus === 'converted' ||
    currentStatus === 'enrolled' ||
    currentStatus === 'ready_to_enroll'
  ) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
          This application has been approved. The student account and enrollment have been created.
        </div>
        <button
          onClick={handleResendOnboarding}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Mail className="w-4 h-4" />
          {loading === 'resend' ? 'Sending…' : 'Resend Onboarding Email'}
        </button>
        {error && <p className="text-sm text-brand-red-600">{error}</p>}
        {success && <p className="text-sm text-brand-green-600">{success}</p>}
      </div>
    );
  }
  if (currentStatus === 'rejected') {
    return (
      <div className="text-sm text-brand-red-700 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3">
        This application has been rejected.
      </div>
    );
  }

  const handleEnroll = async () => {
    setLoading('enroll');
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          funding_type: null,
          source: 'admin-review',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll applicant');

      setSuccess(
        data.enrollment_id
          ? `Enrolled. (enrollment ${data.enrollment_id.slice(0, 8)}…)`
          : `Approved. No program assigned — assign a program to complete enrollment.`,
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(newStatus);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update application');
      }

      setSuccess(`Application ${newStatus === 'rejected' ? 'rejected' : 'updated'}.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Pre-filled inquiry email
  const program = programInterest.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const inquirySubject = encodeURIComponent(`Your Application Inquiry — ${program}`);
  const inquiryBody = encodeURIComponent(
    `Hi ${applicantName},\n\nThank you for your interest in the ${program} program at ${PLATFORM_DEFAULTS.orgName}.\n\nWe wanted to follow up regarding your application and answer any questions you may have.\n\nPlease reply to this email or call us at ${PLATFORM_DEFAULTS.supportPhone}.\n\nBest regards,\n${PLATFORM_DEFAULTS.orgName}\n${PLATFORM_DEFAULTS.supportPhone}\nelevate4humanityedu@gmail.com`,
  );
  const inquiryHref = `mailto:${applicantEmail}?subject=${inquirySubject}&body=${inquiryBody}`;

  return (
    <div className="space-y-3">
      {!programId && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          No matching program found for &quot;{programInterest}&quot;. Enroll will still create the
          user account, but enrollment requires a valid program. You can assign a program manually
          after approval.
        </div>
      )}

      {/* Enroll — creates account, enrollment, and emails the student */}
      <div>
        <button
          onClick={handleEnroll}
          disabled={loading !== null}
          className="w-full py-3 text-sm font-bold rounded-xl bg-brand-green-600 hover:bg-brand-green-700 text-white transition-colors disabled:opacity-50"
        >
          {loading === 'enroll' ? 'Enrolling…' : 'Enroll'}
        </button>
        <p className="text-xs text-slate-400 mt-1 text-center">
          Creates student account, enrollment, and sends approval email
        </p>
      </div>

      {/* Inquiry — opens pre-filled email to applicant */}
      <div>
        <a
          href={inquiryHref}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border-2 border-brand-blue-600 text-brand-blue-600 hover:bg-brand-blue-50 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Application Inquiry
        </a>
        <p className="text-xs text-slate-400 mt-1 text-center">
          Opens email to {applicantEmail || 'applicant'}
        </p>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2 pt-1">
        {currentStatus !== 'under_review' && (
          <button
            onClick={() => handleStatusChange('under_review')}
            disabled={loading !== null}
            className="flex-1 py-2 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
          >
            {loading === 'under_review' ? 'Updating…' : 'Mark Under Review'}
          </button>
        )}
        <button
          onClick={() => handleStatusChange('rejected')}
          disabled={loading !== null}
          className="flex-1 py-2 text-xs font-medium rounded-lg border border-brand-red-200 text-brand-red-600 hover:bg-brand-red-50 transition-colors disabled:opacity-50"
        >
          {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>

      {error && <p className="text-sm text-brand-red-600">{error}</p>}
      {success && <p className="text-sm text-brand-green-600">{success}</p>}
    </div>
  );
}
