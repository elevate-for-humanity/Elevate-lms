export const dynamic = 'force-dynamic';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PartnerLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
          router.push('/partner/dashboard');
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
      router.push('/partner/dashboard');
      router.refresh();

    } catch (err: any) {
      console.error('Partner login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
          emailRedirectTo: `${window.location.origin}/partner/dashboard`,
        },
      });

      if (magicLinkError) {
        throw new Error(magicLinkError.message);
      }

      setError('');
      alert('Check your email for a login link!');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Partner Portal</h1>
          <p className="text-blue-200">Sign in to access your partner dashboard</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center"
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
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={isLoading}
              className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm font-medium disabled:opacity-50"
            >
              Send me a magic link instead
            </button>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600">
              Not a partner yet?{' '}
              <Link href="/partner/apply" className="text-blue-600 font-medium hover:text-blue-700">
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
