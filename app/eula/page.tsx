import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'End User License Agreement | Elevate for Humanity',
  description: 'End User License Agreement for Elevate for Humanity platform, LMS, and digital services.',
  alternates: { canonical: `${SITE_URL}/eula` },
};

export default function EULAPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'EULA' }]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-brand-blue-400" />
          <h1 className="text-4xl font-bold mb-4">End User License Agreement</h1>
          <p className="text-xl text-slate-300">
            Terms governing your use of the Elevate for Humanity platform and digital services.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: February 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-600">
              This End User License Agreement (&quot;EULA&quot;) is a legal agreement between you (&quot;User&quot;)
              and 2Exclusive LLC-S (d/b/a Elevate for Humanity Career &amp; Technical Institute)
              (&quot;Elevate,&quot; &quot;we,&quot; &quot;us&quot;) for the use of the Elevate for Humanity
              learning management system, student portal, employer portal, and all associated digital
              services (collectively, the &quot;Platform&quot;). By creating an account or accessing the
              Platform, you agree to be bound by this EULA.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. License Grant</h2>
            <p className="text-slate-600 mb-3">
              Subject to your compliance with this EULA, Elevate grants you a limited, non-exclusive,
              non-transferable, revocable license to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Access and use the Platform for your personal educational and career development purposes</li>
              <li>View, download, and print course materials made available to you through your enrollment</li>
              <li>Submit assignments, track progress, and communicate with instructors through the Platform</li>
              <li>Access employer portal features if you are an approved employer partner</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Restrictions</h2>
            <p className="text-slate-600 mb-3">You may not:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Copy, modify, distribute, sell, or lease any part of the Platform or its content</li>
              <li>Reverse engineer, decompile, or disassemble any software used in the Platform</li>
              <li>Share your account credentials with any other person</li>
              <li>Use the Platform for any unlawful purpose or in violation of any applicable regulations</li>
              <li>Scrape, crawl, or use automated tools to extract data from the Platform</li>
              <li>Upload malicious code, viruses, or any harmful content</li>
              <li>Impersonate another user or misrepresent your identity or enrollment status</li>
              <li>Use course materials, curricula, or proprietary content outside the Platform without written permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Intellectual Property</h2>
            <p className="text-slate-600">
              All content on the Platform — including course materials, curricula, videos, assessments,
              software, logos, and trademarks — is owned by Elevate for Humanity or its licensors
              (including Milady/Cengage for theory content and Certiport for certification materials).
              This EULA does not transfer any ownership rights to you. Third-party content providers
              retain all rights to their respective materials.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Account Responsibilities</h2>
            <p className="text-slate-600">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You must notify us immediately at{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">
                elevate4humanityedu@gmail.com
              </a>{' '}
              if you suspect unauthorized access. Elevate reserves the right to suspend or terminate
              accounts that violate this EULA or show signs of unauthorized use.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Data and Privacy</h2>
            <p className="text-slate-600">
              Your use of the Platform is also governed by our{' '}
              <Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>.
              We collect and process data in compliance with FERPA (for student educational records),
              WIOA (for workforce program participants), and applicable Indiana state regulations.
              By using the Platform, you consent to the collection and use of data as described in
              our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Third-Party Services</h2>
            <p className="text-slate-600">
              The Platform integrates with third-party services including Supabase (database),
              Stripe (payments), Milady RISE (theory training), Certiport (certification testing),
              and JotForm (forms). Your use of these services is subject to their respective terms.
              Elevate is not responsible for the availability or practices of third-party services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-slate-600">
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind, either express or implied. Elevate does not guarantee uninterrupted access,
              error-free operation, or that the Platform will meet your specific requirements. We do
              not guarantee employment outcomes, certification pass rates, or funding approval.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-slate-600">
              To the maximum extent permitted by law, Elevate shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Platform. Our total liability shall not exceed the amount you paid to Elevate in the
              twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Termination</h2>
            <p className="text-slate-600">
              Elevate may terminate or suspend your access to the Platform at any time for violation
              of this EULA or for any reason with reasonable notice. Upon termination, your license
              to use the Platform ceases immediately. Sections regarding intellectual property,
              disclaimers, and limitation of liability survive termination.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Governing Law</h2>
            <p className="text-slate-600">
              This EULA is governed by the laws of the State of Indiana. Any disputes arising from
              this agreement shall be resolved in the courts of Marion County, Indiana.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Contact</h2>
            <div className="p-6 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900">Elevate for Humanity Career &amp; Technical Institute</p>
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
              {' · '}<Link href="/acceptable-use-policy" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</Link>
              {' · '}<Link href="/license-agreement" className="text-brand-blue-600 hover:underline">License Agreement</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
