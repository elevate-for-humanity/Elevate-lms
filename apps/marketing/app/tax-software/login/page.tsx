'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { taxLoginDestination } from '@/lib/tax-software/login-destination';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
function taxWorkspaceDestination() {
  return taxLoginDestination(
    new URLSearchParams(window.location.search).get('redirect'),
    window.location.origin,
  );
}
export default function TaxLogin() {
  const [returnPath, setReturnPath] = useState('/tax-software/self-file');
  useEffect(() => {
    setReturnPath(taxWorkspaceDestination());
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const s = createClient();
      const { error: authError } = await s.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      const { data: aal, error: aalError } = await s.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        const { data: all, error: factorError } = await s.auth.mfa.listFactors();
        if (factorError) throw factorError;
        const verified = all?.totp.filter((f) => f.status === 'verified') ?? [];
        if (!verified.length)
          throw Error(
            'Complete security verification through the main account sign-in before continuing.',
          );
        setFactors(verified);
        setFactorId(verified[0].id);
        setPassword('');
        setBusy(false);
        return;
      }
      window.location.assign(taxWorkspaceDestination());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
      setBusy(false);
    }
  }
  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      if (verifyError) throw verifyError;
      window.location.assign(taxWorkspaceDestination());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify code.');
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-md">
        <Link href="/tax" className="font-semibold text-sky-800">
          ← Supersonic Fast Cash
        </Link>
        <h1 className="mt-8 text-3xl font-bold">
          {returnPath.startsWith('/tax-software/careers')
            ? 'Continue your job application'
            : returnPath.startsWith('/tax-software/office')
              ? 'Sign in to your office'
              : 'Sign in to your tax workspace'}
        </h1>
        <p className="mt-4 text-slate-600">
          Use your existing Elevate account to continue. Your application, training or tax workspace
          stays connected to your account.
        </p>
        {factors.length > 0 ? (
          <form onSubmit={verify} className="mt-7 space-y-5 rounded-2xl bg-white p-7">
            <h2 className="text-xl font-bold">Verify your account</h2>
            <label className="block font-semibold">
              Authenticator
              <select
                value={factorId}
                onChange={(e) => setFactorId(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              >
                {factors.map((f, i) => (
                  <option key={f.id} value={f.id}>
                    {f.friendly_name || `Authenticator ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-semibold">
              Six-digit code
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify and continue'}
            </button>
            {error && (
              <p role="alert" className="text-red-800">
                {error}
              </p>
            )}
          </form>
        ) : (
          <form onSubmit={signIn} className="mt-7 space-y-5 rounded-2xl bg-white p-7">
            <label className="block font-semibold">
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
            <label className="block font-semibold">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border p-3"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            {error && (
              <p role="alert" className="text-red-800">
                {error}
              </p>
            )}
            <Link href="/forgot-password" className="block font-semibold text-sky-800">
              Forgot your password?
            </Link>
            <Link
              href={
                'https://app.elevateforhumanity.org/signup?next=' +
                encodeURIComponent('https://www.elevateforhumanity.org' + returnPath)
              }
              className="block font-semibold text-sky-800"
            >
              Create an Elevate account
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
