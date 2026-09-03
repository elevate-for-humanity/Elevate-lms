'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type SignInResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

export default function ApprenticeLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = (await response.json().catch(() => null)) as SignInResponse | null;
      if (!response.ok || body?.success !== true) {
        throw new Error(body?.error || body?.message || 'Invalid email or password.');
      }

      // /apprentice resolves real program enrollment, including early
      // enrollment states, instead of treating profiles.role as the authority.
      window.location.assign('/apprentice');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="apprentice-email" className="mb-1 block text-sm font-medium text-slate-200">Email</label>
        <input
          id="apprentice-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="apprentice-password" className="mb-1 block text-sm font-medium text-slate-200">Password</label>
        <input
          id="apprentice-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="mt-2 text-right">
          <Link href="/reset-password" className="text-xs font-semibold text-amber-400 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-semibold text-slate-900 transition hover:bg-amber-600 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
        Sign In
      </button>
    </form>
  );
}
