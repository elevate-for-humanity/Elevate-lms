import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Elevate for Humanity',
  description: 'Acceptable use policy for the Elevate for Humanity platform, LMS, and related services.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/acceptable-use-policy' },
};

export default function AcceptableUsePolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Acceptable Use Policy' }]} />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Acceptable Use Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: February 2025</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Purpose</h2>
            <p className="text-slate-700">This Acceptable Use Policy (&quot;AUP&quot;) governs the use of the Elevate for Humanity platform, learning management system, and all related services. By accessing or using the platform, you agree to comply with this policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Permitted Use</h2>
            <p className="text-slate-700">The platform is provided for legitimate workforce training, education, enrollment, career services, and related administrative purposes. Users may:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Access assigned courses, training materials, and assessments</li>
              <li>Submit applications, enrollment forms, and required documentation</li>
              <li>Communicate with instructors, staff, and peers through platform messaging</li>
              <li>Track progress, credentials, and certification status</li>
              <li>Use career services tools including resume builders and job boards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Prohibited Conduct</h2>
            <p className="text-slate-700">Users shall not:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Share login credentials or allow unauthorized access to accounts</li>
              <li>Submit false information on applications, forms, or assessments</li>
              <li>Copy, distribute, or reproduce course materials without authorization</li>
              <li>Use the platform for commercial solicitation unrelated to training</li>
              <li>Attempt to access restricted areas, admin panels, or other users&apos; data</li>
              <li>Upload malicious files, scripts, or content that disrupts platform operation</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Misrepresent credentials, certifications, or program completion status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Data and Privacy</h2>
            <p className="text-slate-700">Users are responsible for maintaining the confidentiality of their account credentials. Personal data is handled in accordance with our <Link href="/privacy-policy" className="text-brand-red-600 hover:underline">Privacy Policy</Link>, FERPA regulations, and applicable Indiana and federal law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Intellectual Property</h2>
            <p className="text-slate-700">All course content, training materials, assessments, and platform software are the intellectual property of Elevate for Humanity or its licensors. Unauthorized reproduction or distribution is prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Enforcement</h2>
            <p className="text-slate-700">Violations of this policy may result in account suspension, removal from training programs, forfeiture of credentials, and referral to appropriate authorities. Elevate for Humanity reserves the right to investigate suspected violations and take action without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Contact</h2>
            <p className="text-slate-700">Questions about this policy should be directed to <Link href="/support" className="text-brand-red-600 hover:underline">our support team</Link> or emailed to compliance@elevateforhumanity.org.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
