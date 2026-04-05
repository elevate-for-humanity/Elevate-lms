'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: authError }: any = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;
      if (!data?.user) throw new Error('Login succeeded but no user returned');

      // Verify admin role server-side — never trust client-side profile reads
      const check = await fetch('/api/auth/verify-admin-role', { method: 'POST' });
      if (!check.ok) {
        await supabase.auth.signOut();
        setError('This login is for administrators only. Use the main sign-in page for your portal.');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message;
      if (typeof msg === 'string' && msg.toLowerCase().includes('invalid')) {
        setError('Invalid email or password.');
      } else {
        setError(typeof msg === 'string' && msg ? msg : 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative aspect-video">
        <Image
          src="/images/pages/admin-login-hero.jpg"
          alt="Elevate administration"
          fill
          className="object-cover"
          priority
         sizes="100vw" />
        <div className="relative z-10 flex flex-col justify-center px-12">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10 text-cyan-400" />
            <div>
              <div className="text-2xl font-bold text-white">Admin Dashboard</div>
              <div className="text-sm text-gray-500">Elevate for Humanity</div>
            </div>
          </div>
          <p className="text-gray-300 text-lg max-w-md">
            Manage programs, users, enrollments, analytics, and platform configuration.
          </p>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image
              src="/images/logo.png"
              alt="Elevate for Humanity"
              width={140}
              height={40}
              className="h-9 w-auto brightness-0 invert"
            />
          </div>

          <div className="lg:hidden flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Admin Login</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-500">Enter your administrator credentials</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="elevate4humanityedu@gmail.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors block"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-gray-500">
              Not an admin?{' '}
              <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
