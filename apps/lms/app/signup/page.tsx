import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SignupForm from './SignupForm';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export const revalidate = 3600;
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/signup',
  },
  title: 'Create Account',
  description:
    'Create your Elevate account. Students, staff, program partners, and employers all sign up here.',
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const requested = query.next || query.redirect;
  let destination = '/lms/dashboard';
  try {
    destination = validateRedirect(typeof requested === 'string' ? requested : null, destination);
  } catch {
    // Ignore malformed destinations while keeping signup available.
  }
  const supabase = await createClient();

  // Check if signups are enabled (gracefully handle missing table)
  let signupsEnabled = true;
  try {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'signup_enabled')
      .maybeSingle();
    if (settings?.value === 'false' || settings?.value === false) {
      signupsEnabled = false;
    }
  } catch {
    // Table doesn't exist or query failed - allow signups by default
  }
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-black">Create Your Account</h1>
        <p className="mt-2 text-black">
          Create a secure account to access the Elevate platform. Students, staff, program partners,
          and employers all use this page. Select your interest below; operating access is reviewed
          separately from account creation.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-black">Continue with your next step</h2>
          <ul className="mt-3 list-disc pl-5 text-black space-y-2">
            <li>
              <strong>Community members</strong> — share updates, join groups, and participate
              in discussions after signing in
            </li>
            <li>
              <strong>Students</strong> — apply, track progress, upload documents, access your
              learning portal after enrollment approval
            </li>
            <li>
              <strong>Staff &amp; Employees</strong> — complete onboarding, set up payroll, access
              staff tools after authorization
            </li>
            <li>
              <strong>Program Partners &amp; Instructors</strong> — manage cohorts, track students,
              access the partner portal after partnership approval
            </li>
            <li>
              <strong>Employers</strong> — apply for partnership; approved employers can post jobs,
              hire graduates, and use workforce tools
            </li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {signupsEnabled ? (
            <SignupForm />
          ) : (
            <div role="status">
              <h2 className="text-lg font-semibold text-black">Account registration is temporarily unavailable</h2>
              <p className="mt-2 text-black">
                You can still sign in to an existing account, or return later to create a new one.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-black">
          <Link href={`/login?redirect=${encodeURIComponent(destination)}`} className="underline hover:text-brand-blue-600">
            Already have an account? Log in
          </Link>
          <Link href="/start" aria-label="Link" className="underline hover:text-brand-blue-600">
            Not ready to create an account? Apply first
          </Link>
          <Link
            href="/legal/privacy"
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
