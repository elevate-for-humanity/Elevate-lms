import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AcceptInviteClient from './_components/AcceptInviteClient';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: 'Accept Invitation | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/');
  }

  // Fetch invite details server-side so the page renders with context.
  // GET /api/org/accept-invite queries org_invites directly — no RPC dependency.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let inviteDetails: { email: string; role: string; organization_name: string; expires_at: string } | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/org/accept-invite?token=${token}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      inviteDetails = data.invite ?? null;
    } else {
      const data = await res.json().catch(() => ({}));
      fetchError = data.error ?? 'Invalid or expired invitation.';
    }
  } catch {
    fetchError = 'Could not load invitation details.';
  }

  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Organization Invitation</h1>
        </div>

        {fetchError ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">{fetchError}</p>
            <a href="/" className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline">
              Return to home
            </a>
          </div>
        ) : inviteDetails ? (
          <AcceptInviteClient
            token={token}
            invite={inviteDetails}
            isLoggedIn={!!user}
            userEmail={user?.email ?? null}
          />
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500">Loading invitation…</p>
          </div>
        )}
      </div>
    </div>
  );
}
