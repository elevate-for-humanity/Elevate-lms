import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/refund-policy',
  },
  title: 'Refund Policy | Elevate For Humanity',
  description:
    'Learn about our refund policy for training programs and tax services at Elevate For Humanity.',
};

export default async function RefundPolicyPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch refund policy
  const { data: policy } = await db
    .from('legal_documents')
    .select('*')
    .eq('type', 'refund_policy')
    .single();
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Refund Policy" }]} />
      </div>
{/* Hero Section - No Gradient, No Image, No CTAs */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-base md:text-lg text-slate-300">
            Last Updated: December 8, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
              Training Programs
            </h2>
            <p className="text-black mb-6">
              Our training programs are Funded and funded by government
              grants (WIOA, WRG, and other workforce development programs).
              Since there is no tuition cost to students, refunds do not apply
              to our training programs.
            </p>

            <h3 className="text-lg md:text-base sm:text-lg font-bold text-black mb-4 mt-8">
              Program Withdrawal
            </h3>
            <p className="text-black mb-4">
              Students may withdraw from a program at any time. If you need to
              withdraw:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Notify your instructor or program coordinator immediately</li>
              <li>Complete any required withdrawal paperwork</li>
              <li>Return any borrowed equipment or materials</li>
              <li>You may re-apply for future programs if eligible</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Tax Preparation Services
            </h2>
            <p className="text-black mb-6">
              For paid tax preparation services, we offer the following refund
              policy:
            </p>

            <h3 className="text-lg md:text-base sm:text-lg font-bold text-black mb-4 mt-8">
              100% Satisfaction Guarantee
            </h3>
            <p className="text-black mb-4">
              If you are not completely satisfied with our tax preparation
              services, we will:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                Refund your preparation fee in full if requested before filing
              </li>
              <li>Correct any errors at no additional charge</li>
              <li>
                Provide a full refund if we make an error that results in
                penalties or interest
              </li>
            </ul>

            <h3 className="text-lg md:text-base sm:text-lg font-bold text-black mb-4 mt-8">
              Refund Request Timeline
            </h3>
            <p className="text-black mb-4">
              To request a refund for tax preparation services:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                <strong>Before Filing:</strong> Full refund available if you are
                not satisfied before we submit your return
              </li>
              <li>
                <strong>After Filing:</strong> Refunds considered on a
                case-by-case basis for errors or service issues
              </li>
              <li>
                <strong>Processing Time:</strong> Refunds processed within 7-10
                business days
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Tax Refund Advances
            </h2>
            <p className="text-black mb-6">
              Refund advances (Supersonic Fast Cash) are loans provided by
              third-party lenders and are subject to separate terms and
              conditions:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                Refund advances are <strong>non-refundable</strong> once
                disbursed
              </li>
              <li>Fees are disclosed upfront before you accept the advance</li>
              <li>You may decline the advance before funds are disbursed</li>
              <li>Refer to your loan agreement for complete terms</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Maximum Refund Guarantee
            </h2>
            <p className="text-black mb-6">
              We guarantee you will receive the maximum refund you are entitled
              to under the law. If we make an error that results in you
              receiving less than the maximum refund, we will:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Refund our preparation fee</li>
              <li>Pay any penalties or interest resulting from our error</li>
              <li>File an amended return at no charge</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Exceptions
            </h2>
            <p className="text-black mb-4">
              Refunds may not be available in the following situations:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>
                Incomplete or inaccurate information provided by the client
              </li>
              <li>Changes in tax law after filing</li>
              <li>IRS audits or adjustments not caused by our error</li>
              <li>Services already rendered and accepted by the client</li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              How to Request a Refund
            </h2>
            <p className="text-black mb-4">To request a refund:</p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Contact us by phone or email (contact information below)</li>
              <li>
                Provide your name, service date, and reason for refund request
              </li>
              <li>Allow 7-10 business days for processing</li>
              <li>Refunds will be issued to the original payment method</li>
            </ol>

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Contact Us
            </h2>
            <p className="text-black mb-4">
              For refund requests or questions about this policy:
            </p>
            <div className="bg-white p-4 sm:p-6 rounded-lg mb-8">
              <p className="text-black mb-2">
                <strong>Elevate For Humanity</strong>
              </p>
              <p className="text-black mb-2">
                Phone:{' '}
                <a
                  href="/support"
                  className="text-brand-blue-600 hover:underline"
                >
                  317-314-3757
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

            <h2 className="text-2xl md:text-3xl font-bold text-black mb-6 mt-12">
              Changes to This Policy
            </h2>
            <p className="text-black mb-8">
              We reserve the right to modify this refund policy at any time.
              Changes will be posted on this page with an updated revision date.
              Your continued use of our services after changes are posted
              constitutes acceptance of the modified policy.
            </p>

            <div className="mt-12 pt-8 border-t border-slate-200">
              <p className="text-black mb-4">
                <strong>Related Policies:</strong>
              </p>
              <div className="space-y-2">
                <Link
                  href="/privacy-policy"
                  className="block text-brand-blue-600 hover:underline font-semibold"
                >
                  Privacy Policy →
                </Link>
                <Link
                  href="/terms-of-service"
                  className="block text-brand-blue-600 hover:underline font-semibold"
                >
                  Terms of Service →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
