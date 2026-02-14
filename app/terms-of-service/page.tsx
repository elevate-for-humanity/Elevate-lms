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
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Terms of Service' }]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-brand-blue-400" />
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-slate-300">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: January 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600">
              By accessing or using Elevate for Humanity&apos;s website, learning management system, 
              or any of our services, you agree to be bound by these Terms of Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Services Description</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Career training and workforce development programs</li>
              <li>Online learning management system (LMS)</li>
              <li>Job placement and career services</li>
              <li>Certification and credentialing programs</li>
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
              All content and materials are the property of Elevate for Humanity or our licensors.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600">
              Services are provided &quot;as is&quot;. We do not guarantee employment outcomes or specific results.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contact</h2>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700">
                <strong>Elevate for Humanity</strong><br />
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
