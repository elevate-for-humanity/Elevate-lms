'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';
import { mapAuthError } from '@/lib/auth/map-auth-error';
import { hydrateBrowserSupabaseConfig } from '@/lib/supabase/public-config';

export default function ApprenticeLoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const hydrated = await hydrateBrowserSupabaseConfig();
      if (!hydrated) {
        setError(mapAuthError('site configuration'));
        return;
      }

      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(mapAuthError(authError.message));
        return;
      }

      if (!data.user) {
        setError('Login failed');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('portal_type')
        .eq('id', data.user.id)
        .maybeSingle();

      const resolved = redirectTo
        ? redirectTo
        : await resolveStudentHomePath(supabase, data.user.id, profile?.portal_type);

      // Apprentice login page: never fall through to generic learner dashboard
      window.location.href = resolved === '/learner/dashboard' ? '/apprentice' : resolved;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(mapAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="bg-brand-red-50 border border-brand-red-200 rounded-lg px-4 py-3 text-sm text-brand-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="apprentice-email" className="block text-sm font-medium text-slate-800 mb-1">
          Email
        </label>
        <input
          id="apprentice-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="apprentice-password" className="block text-sm font-medium text-slate-800 mb-1">
          Password
        </label>
        <input
          id="apprentice-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        Sign In
      </button>
    </form>
  );
}
