'use client';

import { useState } from 'react';
import { Clock, CheckCircle, User, Loader2 } from 'lucide-react';

interface PendingEnrollment {
  id: string;
  user_id: string;
  program_slug: string | null;
  enrolled_at: string;
  payment_status: string;
  amount_paid_cents: number | null;
  profile: {
    full_name: string | null;
    email: string | null;
    onboarding_completed: boolean;
  } | null;
}

interface Props {
  enrollments: PendingEnrollment[];
}

export default function PendingAccessPanel({ enrollments }: Props) {
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function grantAccess(enrollmentId: string) {
    setLoading(enrollmentId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}/grant-access`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to grant access');
      }
      setGranted(prev => new Set([...prev, enrollmentId]));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(null);
    }
  }

  const pending = enrollments.filter(e => !granted.has(e.id));

  if (pending.length === 0) return null;

  return (
    <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <h2 className="font-bold text-gray-900">Pending Access — Action Required</h2>
          <p className="text-sm text-gray-500">
            {pending.length} student{pending.length !== 1 ? 's' : ''} paid and {pending.length !== 1 ? 'are' : 'is'} waiting for LMS access to be granted.
          </p>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {pending.map(e => {
          const name = e.profile?.full_name || 'Unknown';
          const email = e.profile?.email || '—';
          const program = e.program_slug?.replace(/-/g, ' ') || 'Unknown program';
          const paid = e.amount_paid_cents ? `$${(e.amount_paid_cents / 100).toFixed(0)}` : 'Paid';
          const onboarded = e.profile?.onboarding_completed;
          const enrolledDate = new Date(e.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const isLoading = loading === e.id;

          return (
            <div key={e.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{name}</p>
                <p className="text-sm text-gray-500 truncate">{email}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400 capitalize">{program}</span>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{paid}</span>
                  <span className="text-xs text-gray-400">Enrolled {enrolledDate}</span>
                  {onboarded
                    ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Onboarding ✓</span>
                    : <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Onboarding pending</span>
                  }
                </div>
              </div>

              <button
                onClick={() => grantAccess(e.id)}
                disabled={isLoading || !onboarded}
                title={!onboarded ? 'Student must complete onboarding first' : 'Grant LMS access'}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Granting…</>
                  : <><CheckCircle className="w-4 h-4" /> Grant Access</>
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
