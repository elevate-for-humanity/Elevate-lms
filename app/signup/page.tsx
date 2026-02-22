import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import SignupForm from './SignupForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/signup',
  },
  title: 'Create Account',
  description:
    'Create your account to apply, track progress, upload documents, and manage your training pathway.',
};

export default async function SignupPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Check if signups are enabled (gracefully handle missing table)
  let signupsEnabled = true;
  try {
    const { data: settings } = await db
      .from('site_settings')
      .select('*')
      .eq('key', 'signup_enabled')
      .single();
    if (settings?.value === 'false') {
      signupsEnabled = false;
    }
  } catch {
    // Table doesn't exist or query failed - allow signups by default
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-black">
          Create Your Secure Student Account
        </h1>
        <p className="mt-2 text-black">
          To protect your application and documents, you'll create a secure account. This lets you save progress, upload required documents, and get status updates without calling or waiting.
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Your account includes</h2>
          <ul className="mt-3 list-disc pl-5 text-black space-y-2">
            <li>Save and resume your application anytime</li>
            <li>Upload required documents securely</li>
            <li>Track your application status in real-time</li>
            <li>Access your Student Portal once enrolled</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <SignupForm />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-black">
          <Link
            href="/login"
            aria-label="Link"
            className="underline hover:text-brand-blue-600"
          >
            Already have an account? Log in
          </Link>
          <Link
            href="/apply"
            aria-label="Link"
            className="underline hover:text-brand-blue-600"
          >
            Not ready to create an account? Apply first
          </Link>
          <Link
            href="/privacy"
            aria-label="Link"
            className="underline hover:text-brand-blue-600"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
