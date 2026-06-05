'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function UnauthorizedPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    await sb.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-900 mb-4">
          <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-4">
          Your account does not have permission to access the admin portal.
          Contact your administrator if you believe this is an error.
        </p>
        {email && (
          <p className="text-slate-500 text-xs mb-4">
            Signed in as <span className="text-slate-300">{email}</span>
          </p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium rounded-lg transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
