import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Clock, Shield, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pro License Trial | Elevate for Humanity',
  description: 'Start your 14-day free trial of the Pro License. Full access to all features.',
};

export default function ProLicenseTrialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-4">
            14-Day Free Trial
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Try Pro License Free
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get full access to all Pro features for 14 days. No credit card required.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What&apos;s Included</h2>
              <ul className="space-y-4">
                {[
                  'Unlimited course access',
                  'Priority support',
                  'Advanced analytics',
                  'Custom branding',
                  'API access',
                  'Team collaboration tools',
                  'Certificate customization',
                  'Bulk enrollment',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Your Trial</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your organization"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Start Free Trial
                </button>
                <p className="text-xs text-gray-500 text-center">
                  No credit card required. Cancel anytime.
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center">
            <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">14 Days Free</h3>
            <p className="text-sm text-gray-600">Full access to all features</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <Shield className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">No Risk</h3>
            <p className="text-sm text-gray-600">Cancel anytime, no questions</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <Zap className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Instant Access</h3>
            <p className="text-sm text-gray-600">Start using immediately</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/store/licenses" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Licenses
          </Link>
        </div>
      </div>
    </div>
  );
}
