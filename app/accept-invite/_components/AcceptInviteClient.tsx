'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface InviteDetails {
  email:             string;
  role:              string;
  organization_name: string;
  expires_at:        string;
}

interface Props {
  token:       string;
  invite:      InviteDetails;
  isLoggedIn:  boolean;
  userEmail:   string | null;
}

export default function AcceptInviteClient({ token, invite, isLoggedIn, userEmail }: Props) {
  const router  = useRouter();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const expiresDate = new Date(invite.expires_at).toLocaleDateString();

  async function handleAccept() {
    setState('loading');
    setError('');

    try {
      const res = await fetch('/api/org/accept-invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setError(data.error ?? 'Failed to accept invitation.');
        return;
      }

      setState('success');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch {
      setState('error');
      setError('An unexpected error occurred.');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-800">
          You've joined <strong>{invite.organization_name}</strong>. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Invite summary */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Organization</span>
          <span className="font-medium text-gray-900">{invite.organization_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Invited email</span>
          <span className="font-medium text-gray-900">{invite.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Role</span>
          <span className="font-medium text-gray-900 capitalize">{invite.role}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Expires</span>
          <span className="text-gray-700">{expiresDate}</span>
        </div>
      </div>

      {!isLoggedIn ? (
        /* Not logged in — send to login with return URL */
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center">
            Sign in to accept this invitation.
          </p>
          <a
            href={`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            className="block w-full rounded-md bg-brand-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-blue-700"
          >
            Sign in to accept
          </a>
          <a
            href={`/signup?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Create account
          </a>
        </div>
      ) : (
        /* Logged in — show accept button */
        <div className="space-y-3">
          {userEmail && userEmail.toLowerCase() !== invite.email.toLowerCase() && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
              You are signed in as <strong>{userEmail}</strong>, but this invitation was sent to{' '}
              <strong>{invite.email}</strong>. You can still accept, but make sure this is the right account.
            </div>
          )}

          {state === 'error' && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={state === 'loading'}
            className="w-full rounded-md bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {state === 'loading' ? 'Accepting…' : `Join ${invite.organization_name}`}
          </button>
          <a href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600">
            Decline
          </a>
        </div>
      )}
    </div>
  );
}
