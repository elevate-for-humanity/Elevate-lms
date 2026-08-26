import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Enterprise Licensing',
  description: 'License Elevate for Humanity platform technology for your organization. Enterprise LMS, workforce tools, and white-label solutions.',
};

export const revalidate = 3600;

export default function LicensingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Enterprise Licensing</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Power your workforce development programs with our proven platform technology. Built for training providers, employers, and workforce agencies.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-emerald-500">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Platform License</h3>
              <p className="text-slate-600 mb-6">Full access to the Elevate LMS platform with all courses, assessments, and student management tools.</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li>✓ Unlimited student enrollments</li>
                <li>✓ All program content included</li>
                <li>✓ Student tracking & analytics</li>
                <li>✓ Certificate generation</li>
              </ul>
              <Link href="/contact" className="block text-center bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-700">Request Quote</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-500">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">White Label</h3>
              <p className="text-slate-600 mb-6">Rebrand the platform with your organization's identity, colors, and domain.</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li>✓ Custom domain & branding</li>
                <li>✓ Remove Elevate branding</li>
                <li>✓ API access & integrations</li>
                <li>✓ Dedicated support</li>
              </ul>
              <Link href="/contact?type=white-label" className="block text-center bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">Learn More</Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-amber-500">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">API Access</h3>
              <p className="text-slate-600 mb-6">Integrate Elevate tools and data into your existing systems via our REST API.</p>
              <ul className="text-sm text-slate-600 space-y-2 mb-6">
                <li>✓ Student data sync</li>
                <li>✓ Program management</li>
                <li>✓ Credential verification</li>
                <li>✓ Webhook notifications</li>
              </ul>
              <Link href="/docs/api" className="block text-center bg-amber-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-amber-700">View Docs</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-8">Contact our team for a personalized demo and pricing discussion.</p>
          <Link href="/contact?type=enterprise" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 mr-4">Contact Sales</Link>
          <Link href="/store" className="bg-white text-brand-blue-600 font-bold py-3 px-8 rounded-lg border-2 border-brand-blue-600 hover:bg-blue-50">View All Products</Link>
        </div>
      </section>
    </div>
  );
}
