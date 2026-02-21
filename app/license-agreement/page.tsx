import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'License Agreement | Elevate for Humanity',
  description: 'Software license agreement for Elevate for Humanity white-label LMS and platform licensing.',
  alternates: { canonical: `${SITE_URL}/license-agreement` },
};

export default function LicenseAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License Agreement' }]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-brand-blue-400" />
          <h1 className="text-4xl font-bold mb-4">License Agreement</h1>
          <p className="text-xl text-slate-300">
            Terms for licensing the Elevate for Humanity platform and white-label services.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: February 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Parties</h2>
            <p className="text-slate-600">
              This License Agreement (&quot;Agreement&quot;) is between 2Exclusive LLC-S (d/b/a Elevate
              for Humanity Career &amp; Technical Institute) (&quot;Licensor&quot;) and the organization
              or individual purchasing a platform license (&quot;Licensee&quot;). This Agreement governs
              the use of the Elevate for Humanity LMS platform, white-label configurations, and
              associated services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. License Types</h2>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Starter License</h3>
            <p className="text-slate-600">
              Single-location use. Includes LMS access, student portal, basic reporting, and
              email support. Limited to one branded instance.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Professional License</h3>
            <p className="text-slate-600">
              Multi-location use. Includes all Starter features plus employer portal, advanced
              analytics, API access, custom branding, and priority support.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">Enterprise License</h3>
            <p className="text-slate-600">
              Unlimited locations. Includes all Professional features plus white-label deployment,
              custom integrations, dedicated support, SLA guarantees, and source code escrow.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Grant of License</h2>
            <p className="text-slate-600">
              Upon payment of applicable fees, Licensor grants Licensee a non-exclusive,
              non-transferable license to use the Platform for the Licensee&apos;s internal
              educational and workforce development operations. The license is valid for the
              subscription period specified in the order form.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Licensee Obligations</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Use the Platform only for lawful educational and workforce development purposes</li>
              <li>Maintain the security of all account credentials and API keys</li>
              <li>Comply with FERPA, WIOA, and applicable data protection regulations</li>
              <li>Not sublicense, resell, or redistribute the Platform without written consent</li>
              <li>Not modify, reverse engineer, or create derivative works from the Platform source code</li>
              <li>Provide accurate enrollment and reporting data as required by funding agencies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-600">
              The Platform, including all software, designs, documentation, and content, remains
              the exclusive property of Licensor. Licensee retains ownership of their own data,
              student records, and custom content uploaded to the Platform. Upon termination,
              Licensee may export their data within 30 days.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Payment Terms</h2>
            <p className="text-slate-600">
              License fees are billed according to the selected plan (monthly or annual).
              All fees are non-refundable except as required by law. Licensor reserves the
              right to adjust pricing with 60 days written notice before the next renewal period.
              Late payments may result in suspension of Platform access.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Support and Maintenance</h2>
            <p className="text-slate-600">
              Licensor will provide technical support and Platform maintenance according to the
              service level associated with the Licensee&apos;s plan. Updates and security patches
              are included in the license fee. Custom development work is billed separately.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Warranty and Disclaimer</h2>
            <p className="text-slate-600">
              Licensor warrants that the Platform will perform substantially as described in the
              documentation. THE PLATFORM IS OTHERWISE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES
              OF ANY KIND. Licensor does not warrant uninterrupted service, error-free operation,
              or fitness for a particular purpose beyond what is documented.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-600">
              Licensor&apos;s total liability under this Agreement shall not exceed the fees paid
              by Licensee in the twelve (12) months preceding the claim. Licensor shall not be
              liable for indirect, incidental, special, or consequential damages.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Term and Termination</h2>
            <p className="text-slate-600">
              This Agreement is effective for the subscription period and renews automatically
              unless either party provides 30 days written notice of non-renewal. Either party
              may terminate for material breach with 15 days written notice and opportunity to cure.
              Upon termination, Licensee must cease all use of the Platform and destroy any copies
              of proprietary materials.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Governing Law</h2>
            <p className="text-slate-600">
              This Agreement is governed by the laws of the State of Indiana. Disputes shall be
              resolved in the courts of Marion County, Indiana.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact</h2>
            <div className="p-6 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900">Elevate for Humanity — Licensing</p>
              <p className="text-slate-600">8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>
              <p className="text-slate-600 mt-2">
                Email: <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">elevate4humanityedu@gmail.com</a>
              </p>
              <p className="text-slate-600">
                Phone: <a href="tel:3172968560" className="text-brand-blue-600 hover:underline">(317) 296-8560</a>
              </p>
            </div>
          </section>

          <div className="mt-8 pt-8 border-t text-sm text-slate-500">
            <p>
              See also: <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link>
              {' · '}<Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>
              {' · '}<Link href="/eula" className="text-brand-blue-600 hover:underline">EULA</Link>
              {' · '}<Link href="/acceptable-use-policy" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
