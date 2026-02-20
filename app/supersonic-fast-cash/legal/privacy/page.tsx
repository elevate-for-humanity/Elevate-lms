export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Privacy Policy | Supersonic Fast Cash',
  description: 'Privacy policy for Supersonic Fast Cash tax preparation services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/legal/privacy',
  },
};

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('tax_returns').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Privacy" }]} />
      </div>
<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Supersonic Fast Cash, a trade name of 2Exclusive LLC-S (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our tax preparation services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 mb-4">We collect information necessary to prepare and file your tax return:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Personal identification (name, address, Social Security number, date of birth)</li>
              <li>Income information (W-2s, 1099s, other income documents)</li>
              <li>Deduction and credit information</li>
              <li>Bank account information for direct deposit</li>
              <li>Contact information (email, phone number)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Prepare and file your tax return</li>
              <li>Process refund advance applications (if you choose this option)</li>
              <li>Communicate with you about your return</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Improve our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 mb-4">We share your information only as necessary:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>With the IRS and state tax authorities to file your return</li>
              <li>With banking partners if you apply for a refund advance</li>
              <li>With service providers who assist in our operations</li>
              <li>As required by law or legal process</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your 
              personal information, including encryption of sensitive data in transit and at rest.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your tax return information as required by IRS regulations and for our 
              legitimate business purposes. You may request deletion of your account, subject 
              to legal retention requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion (subject to legal requirements)</li>
              <li>Opt out of marketing communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions or requests, contact us at:
            </p>
            <p className="text-gray-700">
              2Exclusive LLC-S (d/b/a Supersonic Fast Cash)<br />
              Email: privacy@supersonicfastcash.com<br />
              Phone: Get Help Online
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of 
              material changes by posting the updated policy on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
