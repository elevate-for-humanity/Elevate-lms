import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Users, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Services | Elevate for Humanity',
  description: 'Elevate for Humanity serves the community through workforce development and training.',
};

export default function CommunityServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Services</h1>
          <p className="text-xl text-blue-100">Serving our community through workforce development.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Heart className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Workforce Development</h3>
              <p className="text-gray-600">Free and low-cost training programs for community members.</p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Job Placement</h3>
              <p className="text-gray-600">Connecting graduates with local employers.</p>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community Partners</h3>
              <p className="text-gray-600">Working with local organizations to serve our community.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Involved</h2>
          <p className="text-gray-600 mb-8">Partner with us to serve our community.</p>
          <Link href="/contact" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg">Contact Us</Link>
        </div>
      </section>
    </div>
  );
}
