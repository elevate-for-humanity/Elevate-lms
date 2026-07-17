'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';

export default function ApprenticeLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid credentials');
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

      const dest = await resolveStudentHomePath(
        supabase,
        data.user.id,
        profile?.portal_type,
      );

      window.location.href = dest;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="apprentice-email" className="block text-sm font-medium text-slate-200 mb-1">
          Email
        </label>
        <input
          id="apprentice-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="apprentice-password" className="block text-sm font-medium text-slate-200 mb-1">
          Password
        </label>
        <input
          id="apprentice-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        Sign In
      </button>
    </form>
  );
}
