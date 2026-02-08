import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, Lock, Eye, FileText, Phone } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Privacy Policy | Elevate for Humanity',
  description: 'Learn how Elevate for Humanity collects, uses, and protects your personal information.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-slate-300">
            Your privacy matters. Learn how we protect your information.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: January 2025</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" /> Information We Collect
            </h2>
            <p className="text-slate-600 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Name, email address, phone number, and mailing address</li>
              <li>Educational background and employment history</li>
              <li>Program enrollment and progress information</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Communications you send to us</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" /> How We Use Your Information
            </h2>
            <p className="text-slate-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Process your enrollment and provide educational services</li>
              <li>Communicate with you about programs, services, and opportunities</li>
              <li>Comply with federal and state workforce development reporting requirements</li>
              <li>Improve our programs and services</li>
              <li>Protect against fraud and unauthorized access</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" /> Information Sharing
            </h2>
            <p className="text-slate-600 mb-4">We may share your information with:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Workforce development agencies (as required for WIOA, WRG, JRI funding)</li>
              <li>Employers (with your consent, for job placement services)</li>
              <li>Certification bodies (to verify credentials)</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="text-slate-600 mt-4">We do not sell your personal information to third parties.</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Rights</h2>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Data Security</h2>
            <p className="text-slate-600">
              We implement appropriate technical and organizational measures to protect your 
              personal information against unauthorized access, alteration, disclosure, or 
              destruction.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <div className="bg-slate-50 rounded-xl p-6">
              <p className="text-slate-700">
                <strong>Elevate for Humanity</strong><br />
                Email: <a href="mailto:privacy@elevateforhumanity.org" className="text-blue-600 hover:underline">privacy@elevateforhumanity.org</a><br />
                Phone: Contact Us<br />
                Address: Indianapolis, IN
              </p>
            </div>
          </section>
        </div>

        <div className="border-t pt-8 mt-8">
          <h3 className="font-bold text-slate-900 mb-4">Related Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link>
            <Link href="/accessibility" className="text-blue-600 hover:underline">Accessibility</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
