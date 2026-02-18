
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Force cache bust
interface InviteData {
  organizationName: string;
  inviterName?: string;
  email: string;
  expiresAt: string;
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvite();
  }, [token]);

  async function loadInvite() {
    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Service unavailable');
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any).rpc('get_org_invite_by_token', {
        p_token: token,
      });

      if (error || !data || data.length === 0) {
        setError('Invalid or expired invitation');
        setLoading(false);
        return;
      }

      const inviteData = data[0];

      // Check expiration
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (inviteData.accepted_at) {
        setError('This invitation has already been accepted');
        setLoading(false);
        return;
      }

      setInvite({
        organizationName: inviteData.organization_name,
        inviterName: inviteData.inviter_name,
        email: inviteData.email,
        expiresAt: inviteData.expires_at,
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load invitation');
      setLoading(false);
    }
  }

  async function acceptInvite() {
    setAccepting(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Service unavailable');
        setAccepting(false);
        return;
      }

      // Check if user is logged in
      const {
        data: { user },
      } = await (supabase as any).auth.getUser();

      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?redirect=/invite/${token}`);
        return;
      }

      // Accept invite via API
      const response = await fetch(`/api/org/invite/${token}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to accept invitation');
      }

      // Success - redirect to organization dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(
        'An error occurred'
      );
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto" />
          <p className="mt-4 text-black">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-red-100">
              <svg
                className="h-10 w-10 text-brand-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-black">
              Invalid Invitation
            </h2>
            <p className="mt-2 text-black">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full bg-brand-blue-600 text-white py-2 px-4 rounded-md hover:bg-brand-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-brand-blue-100">
            <svg
              className="h-10 w-10 text-brand-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-black">
            You're Invited!
          </h2>
          <p className="mt-2 text-black">
            {invite.inviterName ? (
              <>
                <span className="font-semibold">{invite.inviterName}</span> has
                invited you to join
              </>
            ) : (
              'You have been invited to join'
            )}
          </p>
          <p className="mt-1 text-xl font-semibold text-black">
            {invite.organizationName}
          </p>

          <div className="mt-6 bg-gray-50 rounded-md p-4">
            <p className="text-sm text-black">
              <span className="font-medium">Email:</span> {invite.email}
            </p>
            <p className="mt-2 text-sm text-black">
              <span className="font-medium">Expires:</span>{' '}
              {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={acceptInvite}
            disabled={accepting}
            className="mt-6 w-full bg-brand-blue-600 text-white py-2 px-4 rounded-md hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </button>

          <p className="mt-4 text-xs text-black">
            By accepting, you will become a member of this organization
          </p>
        </div>
      </div>
    </div>
  );
}
