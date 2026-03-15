import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Phone } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Terms of Service | Elevate for Humanity',
  description: 'Terms and conditions for using Elevate for Humanity services and programs.',
  alternates: { canonical: `${SITE_URL}/terms-of-service` },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Terms of Service' }]} />
        </div>
      </div>

      <section className="bg-white text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-brand-blue-400" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-slate-300">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: February 22, 2026</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600">
              Elevate for Humanity is operated by 2Exclusive LLC-S (d/b/a Elevate for Humanity 
              Career &amp; Technical Institute) (&quot;School,&quot; &quot;we,&quot; &quot;us&quot;), 
              a registered limited liability company in the State of Indiana.
              We may collaborate with Selfish Inc. (d/b/a Rise Forward Foundation) to provide 
              supportive services, including mental wellness programming (CurvatureBody Sculpting).
              Certain training programs may be delivered in collaboration with third-party training 
              partners such as Choice Medical CNA School.
              These Terms govern your use of the Elevate for Humanity websites, portals, and 
              services provided by the School.
              By accessing or using our website, learning management system,
              or any of our services, you agree to be bound by these Terms of Service.
              If you do not agree, do not use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Services Description</h2>
            <p className="text-slate-600 mb-3">
              The Company provides the following services under the Elevate for Humanity brand:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Career training and workforce development programs</li>
              <li>Online learning management system (LMS)</li>
              <li>Job placement and career services</li>
              <li>Certification and credentialing programs</li>
              <li>DOL Registered Apprenticeship sponsorship</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Responsibilities</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect intellectual property rights</li>
              <li>Follow our academic integrity policies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Program Enrollment</h2>
            <p className="text-slate-600">
              Enrollment is subject to eligibility requirements, available funding, and program capacity.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property</h2>
            <p className="text-slate-600">
              All content, materials, courseware, and platform software are the property
              of 2Exclusive LLC-S (d/b/a Elevate for Humanity Career &amp; Technical Institute) or our licensors.
              Unauthorized reproduction or distribution is prohibited.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600">
              Services are provided &quot;as is.&quot; The Company does not guarantee
              employment outcomes, certification results, or specific program availability.
              Liability is limited to the fees paid for the specific service in question.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Governing Law</h2>
            <p className="text-slate-600">
              These Terms are governed by the laws of the State of Indiana.
              Any disputes shall be resolved in the courts of Marion County, Indiana.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Contact</h2>
            <div className="bg-white rounded-xl p-6">
              <p className="text-slate-700">
                <strong>2Exclusive LLC-S</strong><br />
                d/b/a Elevate for Humanity Career &amp; Technical Institute<br />
                Email: <a href="mailto:legal@elevateforhumanity.org" className="text-brand-blue-600 hover:underline">legal@elevateforhumanity.org</a><br />
                Phone: (317) 314-3757
              </p>
            </div>
          </section>
        </div>

        <div className="border-t pt-8 mt-8">
          <h3 className="font-bold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>
            <Link href="/accessibility" className="text-brand-blue-600 hover:underline">Accessibility</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
