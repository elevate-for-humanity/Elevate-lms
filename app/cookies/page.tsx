import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/cookies',
  },
  title: 'Cookie Policy | Elevate For Humanity',
  description:
    'Learn about how Elevate For Humanity uses cookies and similar technologies on our website.',
};

export default async function CookiesPage() {
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
  
  // Fetch cookie policy content
  const { data: policy } = await db
    .from('legal_documents')
    .select('*')
    .eq('type', 'cookie_policy')
    .single();

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />
        </div>
      </div>

      {/* Hero Section - No Gradient */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-base md:text-lg text-slate-300">
            Last Updated: February 22, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
              What Are Cookies?
            </h2>
            <p className="text-black mb-6">
              Cookies are small text files that are placed on your computer or
              mobile device when you visit our website. They help us provide you
              with a better experience by remembering your preferences and
              understanding how you use our site.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              How We Use Cookies
            </h2>
            <p className="text-black mb-4">
              Elevate For Humanity uses cookies for the following purposes:
            </p>

            <h3 className="text-lg md:text-lg font-bold text-black mb-4 mt-8">
              Essential Cookies
            </h3>
            <p className="text-black mb-4">
              These cookies are necessary for the website to function properly.
              They enable basic functions like:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Page navigation</li>
              <li>Access to secure areas</li>
              <li>Form submissions</li>
              <li>User authentication</li>
            </ul>

            <h3 className="text-lg md:text-lg font-bold text-black mb-4 mt-8">
              Analytics Cookies
            </h3>
            <p className="text-black mb-4">
              We use analytics cookies to understand how visitors interact with
              our website. This helps us improve our services. These cookies
              collect information such as:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Number of visitors</li>
              <li>Pages visited</li>
              <li>Time spent on pages</li>
              <li>Traffic sources</li>
            </ul>

            <h3 className="text-lg md:text-lg font-bold text-black mb-4 mt-8">
              Functionality Cookies
            </h3>
            <p className="text-black mb-6">
              These cookies allow our website to remember choices you make (such
              as your language preference) and provide enhanced, personalized
              features.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Third-Party Cookies
            </h2>
            <p className="text-black mb-4">
              We may use third-party services that set cookies on our website,
              including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                <strong>Google Analytics:</strong> To analyze website traffic
                and usage
              </li>
              <li>
                <strong>Social Media Platforms:</strong> To enable social
                sharing features
              </li>
              <li>
                <strong>Video Platforms:</strong> To embed video content
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Managing Cookies
            </h2>
            <p className="text-black mb-4">
              You can control and manage cookies in several ways:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                <strong>Browser Settings:</strong> Most browsers allow you to
                refuse or accept cookies through their settings
              </li>
              <li>
                <strong>Delete Cookies:</strong> You can delete cookies that
                have already been set
              </li>
              <li>
                <strong>Opt-Out Tools:</strong> Use browser extensions or
                opt-out tools provided by third parties
              </li>
            </ul>
            <p className="text-black mb-6">
              Please note that blocking or deleting cookies may impact your
              experience on our website and limit certain features.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Your Consent
            </h2>
            <p className="text-black mb-6">
              By using our website, you consent to our use of cookies as
              described in this policy. If you do not agree with our use of
              cookies, you should adjust your browser settings accordingly or
              refrain from using our website.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Changes to This Policy
            </h2>
            <p className="text-black mb-6">
              We may update this Cookie Policy from time to time. Any changes
              will be posted on this page with an updated revision date.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Contact Us
            </h2>
            <p className="text-black mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-slate-50 p-6 rounded-lg mb-8">
              <p className="text-black mb-2">
                <strong>Elevate For Humanity</strong>
              </p>
              <p className="text-black mb-2">
                Phone:{' '}
                <a
                  href="/support"
                  className="text-brand-blue-600 hover:underline"
                >
                  support center
                </a>
              </p>
              <p className="text-black">
                Email:{' '}
                <a
                  href="/contact"
                  className="text-brand-blue-600 hover:underline"
                >
                  our contact form
                </a>
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <Link
                href="/privacy-policy"
                className="text-brand-blue-600 hover:underline font-semibold"
              >
                View our Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
