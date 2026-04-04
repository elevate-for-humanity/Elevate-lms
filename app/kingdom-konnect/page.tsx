import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Users, Globe, ArrowRight,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Kingdom Konnect | Elevate for Humanity',
  description: 'Faith-based community partnerships for workforce development and community transformation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/kingdom-konnect',
  },
};

export default function KingdomKonnectPage() {
  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Kingdom Konnect' },
        ]}
      />
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/kingdom-konnect-page-1.jpg" alt="Kingdom Konnect" fill className="object-cover" priority sizes="100vw" />
        
      </section>
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Church Partnerships</h3>
              <p className="text-gray-600">Partner with local churches to provide workforce training to congregation members.</p>
            </div>
            <div className="text-center">
              <Globe className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community Outreach</h3>
              <p className="text-gray-600">Extend training opportunities to underserved communities through faith networks.</p>
            </div>
            <div className="text-center">
              <Heart className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Holistic Support</h3>
              <p className="text-gray-600">Combine career training with spiritual and emotional support services.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Partner With Us</h2>
          <p className="text-xl text-white mb-8">Join our network of faith-based organizations making a difference.</p>
          <Link href="/partners" className="bg-white hover:bg-white text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Learn More <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-white mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
