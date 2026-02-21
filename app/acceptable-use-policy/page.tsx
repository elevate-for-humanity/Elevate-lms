import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AlertTriangle } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Elevate for Humanity',
  description: 'Acceptable use policy for the Elevate for Humanity platform, LMS, and digital services.',
  alternates: { canonical: `${SITE_URL}/acceptable-use-policy` },
};

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Acceptable Use Policy' }]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-brand-orange-400" />
          <h1 className="text-4xl font-bold mb-4">Acceptable Use Policy</h1>
          <p className="text-xl text-slate-300">
            Guidelines for appropriate use of the Elevate for Humanity platform.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: February 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Purpose</h2>
            <p className="text-slate-600">
              This Acceptable Use Policy (&quot;AUP&quot;) defines the rules and guidelines for using
              the Elevate for Humanity platform, including the learning management system, student portal,
              employer portal, and all associated services. This policy applies to all users: students,
              instructors, employers, partners, and administrators.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Permitted Use</h2>
            <p className="text-slate-600 mb-3">The Platform may be used for:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Completing enrolled coursework, assignments, and assessments</li>
              <li>Accessing training materials, videos, and resources assigned to your program</li>
              <li>Communicating with instructors, advisors, and support staff through Platform messaging</li>
              <li>Tracking attendance, hours, and program progress</li>
              <li>Submitting applications, forms, and required documentation</li>
              <li>Employer partners: posting opportunities, reviewing candidates, and managing apprenticeships</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Prohibited Conduct</h2>
            <p className="text-slate-600 mb-3">The following activities are strictly prohibited:</p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Academic Integrity</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Submitting work that is not your own (plagiarism)</li>
              <li>Sharing quiz or exam answers with other students</li>
              <li>Using unauthorized aids during proctored assessments</li>
              <li>Falsifying attendance records, hours, or progress data</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Platform Misuse</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Sharing account credentials or allowing others to access your account</li>
              <li>Attempting to access accounts, data, or systems you are not authorized to use</li>
              <li>Uploading malware, viruses, or malicious files</li>
              <li>Using automated scripts, bots, or scrapers on the Platform</li>
              <li>Circumventing security measures or access controls</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Content and Communication</h3>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Posting harassing, threatening, discriminatory, or obscene content</li>
              <li>Sending spam or unsolicited commercial messages</li>
              <li>Sharing confidential student or employer information</li>
              <li>Recording or distributing live instruction sessions without permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Protection</h2>
            <p className="text-slate-600">
              Users must handle all personal data encountered on the Platform in accordance with
              FERPA, WIOA, and applicable privacy regulations. Student educational records, enrollment
              data, and funding information are confidential. Unauthorized disclosure of protected
              information may result in immediate termination and legal action.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-600">
              Course materials, curricula, assessments, and proprietary content are protected by
              copyright. Users may not reproduce, distribute, or share Platform content outside
              their authorized use. This includes Milady RISE theory content, Certiport exam
              materials, and Elevate-developed curricula.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Enforcement</h2>
            <p className="text-slate-600 mb-3">
              Violations of this AUP may result in:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Written warning</li>
              <li>Temporary suspension of Platform access</li>
              <li>Permanent account termination</li>
              <li>Removal from enrolled programs</li>
              <li>Reporting to funding agencies (WIOA, DOL) if applicable</li>
              <li>Legal action for serious violations</li>
            </ul>
            <p className="text-slate-600 mt-3">
              Elevate reserves the right to investigate suspected violations and take appropriate
              action at its sole discretion.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Reporting Violations</h2>
            <p className="text-slate-600">
              If you witness a violation of this policy, report it to{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
                elevate4humanityedu@gmail.com
              </a>{' '}
              or call <a href="tel:3172968560" className="text-brand-blue-600 hover:underline">(317) 296-8560</a>.
              Reports may be made anonymously through the{' '}
              <Link href="/grievance" className="text-brand-blue-600 hover:underline">grievance form</Link>.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t text-sm text-slate-500">
            <p>
              See also: <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link>
              {' · '}<Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>
              {' · '}<Link href="/eula" className="text-brand-blue-600 hover:underline">EULA</Link>
              {' · '}<Link href="/license-agreement" className="text-brand-blue-600 hover:underline">License Agreement</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
