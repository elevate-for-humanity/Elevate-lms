'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getAdminUrl } from '@/lib/utils/siteUrl';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'];

function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSafeSearchParams();
  const configuredAdminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  const isLocalConfiguredAdminUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(
    configuredAdminUrl,
  );
  const ADMIN_URL =
    process.env.NODE_ENV === 'development'
      ? isLocalConfiguredAdminUrl
        ? configuredAdminUrl
        : 'http://localhost:3001'
      : getAdminUrl();
  const requestedRedirect = searchParams.get('redirect');
  const redirectTo = requestedRedirect
    ? requestedRedirect.startsWith('http')
      ? requestedRedirect
      : `${ADMIN_URL}${requestedRedirect.startsWith('/') ? requestedRedirect : `/${requestedRedirect}`}`
    : `${ADMIN_URL}/admin/dashboard`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;
      if (!data?.user) throw new Error('Login failed — no user returned');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        await supabase.auth.signOut();
        setError('This login is for administrators only.');
        setLoading(false);
        return;
      }

      window.location.href = redirectTo;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.toLowerCase().includes('invalid') ? 'Invalid email or password.' : msg || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
        <Shield className="w-6 h-6 text-white" />
        <span className="text-white font-bold text-lg">Elevate Admin Portal</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Administrator Sign In</h1>
            <p className="text-slate-500 text-sm mb-8">Restricted to authorized staff only.</p>
            {error && (
              <div className="mb-6 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" autoFocus
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="you@elevateforhumanity.org" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-12"
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-base transition-colors">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500">
              Need help? <a href="tel:+13173143757" className="text-blue-600 font-semibold hover:underline">(317) 314-3757</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
