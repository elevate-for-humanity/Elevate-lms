'use client';
import { Suspense } from 'react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const IDENTITY_ERRORS: Record<string, string> = {
  identity: 'Your account could not be verified. Please contact support.',
  no_partner: 'Your account is not linked to a partner organization. Please contact support at info@elevateforhumanity.org.',
};

function PartnerLoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Show identity guard errors from redirect
  useEffect(() => {
    const errCode = searchParams.get('error');
    if (errCode && IDENTITY_ERRORS[errCode]) {
      setError(IDENTITY_ERRORS[errCode]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again.');
      }

      // Verify user is a partner
      const { data: partnerUser, error: partnerError } = await supabase
        .from('partner_users')
        .select('partner_id, role, status')
        .eq('user_id', data.user.id)
        .single();

      if (partnerError || !partnerUser) {
        // Check if they have partner role in profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'partner' || profile?.role === 'partner_admin') {
          // They have partner role but no partner_users entry - allow access
          router.push('/partner-portal');
          return;
        }

        // Not a partner - sign them out and show error
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a partner. Please contact support.');
      }

      // Check partner status
      if (partnerUser.status === 'pending_activation') {
        throw new Error('Your partner account is pending activation. Please check your email for the activation link.');
      }

      if (partnerUser.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Your partner account has been suspended. Please contact support.');
      }

      // Success - redirect to partner dashboard
      router.push('/partner-portal');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as any)?.message;
      setError(typeof msg === 'string' && msg ? msg : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // ?next= is read by /auth/callback and takes priority over role-based routing.
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/partner/dashboard`,
        },
      });

      if (magicLinkError) {
        throw new Error(magicLinkError.message);
      }

      setError('');
      setMagicLinkSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'An error occurred sending the magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-8.jpg" alt="Partner login" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Partner Portal</h1>
          <p className="text-brand-blue-200">Sign in to access your partner dashboard</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" 
                  placeholder="partner@company.com" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-brand-blue-600 border-gray-300 rounded focus:ring-brand-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/reset-password" className="text-sm text-brand-blue-600 hover:text-brand-blue-700">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? 'Signing in...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            {magicLinkSent ? (
              <div className="p-3 bg-brand-green-50 border border-brand-green-200 rounded-lg text-brand-green-800 text-sm text-center">
                Magic link sent to <strong>{email}</strong>. Check your inbox.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={isLoading}
                className="w-full text-brand-blue-600 hover:text-brand-blue-700 py-2 text-sm font-medium disabled:opacity-50"
              >
                Send me a magic link instead
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600">
              Not a partner yet?{' '}
              <Link href="/partner/onboarding" className="text-brand-blue-600 font-medium hover:text-brand-blue-700">
                Apply here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Looking for student login?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerLoginPage() {
  return (
    <Suspense>
      <PartnerLoginPageInner />
    </Suspense>
  );
}
