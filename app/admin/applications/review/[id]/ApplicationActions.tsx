'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  applicationId: string;
  currentStatus: string;
  programId: string | null;
  programInterest: string;
}

export default function ApplicationActions({
  applicationId,
  currentStatus,
  programId,
  programInterest,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Terminal states
  if (currentStatus === 'approved' || currentStatus === 'converted' || currentStatus === 'enrolled') {
    return (
      <div className="text-sm text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
        This application has been approved. The student account and enrollment have been created.
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

  const handleApprove = async () => {
    setLoading('approve');
    setError(null);
    setSuccess(null);

    try {
      // Use the full approve endpoint that creates user + enrollment
      const res = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          funding_type: null,
          source: 'admin-review',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      setSuccess(
        `Approved! User created (${data.user_id?.slice(0, 8)}...) and enrolled (${data.enrollment_id?.slice(0, 8)}...).`
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {!programId && (
        <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          No matching program found for &quot;{programInterest}&quot;. Approve will still create the
          user account, but enrollment requires a valid program. You can assign a program manually
          after approval.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {currentStatus === 'pending' || currentStatus === 'submitted' ? (
          <>
            <button
              onClick={() => handleStatusChange('in_review')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'in_review' ? 'Updating...' : 'Start Review'}
            </button>
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'approve' ? 'Approving...' : 'Approve & Enroll'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-red-600 hover:bg-brand-red-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        ) : currentStatus === 'in_review' ? (
          <>
            <button
              onClick={handleApprove}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-green-600 hover:bg-brand-green-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'approve' ? 'Approving...' : 'Approve & Enroll'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-red-600 hover:bg-brand-red-700 text-white transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        ) : null}
      </div>

      {error && <p className="text-sm text-brand-red-600">{error}</p>}
      {success && <p className="text-sm text-brand-green-600">{success}</p>}
    </div>
  );
}
