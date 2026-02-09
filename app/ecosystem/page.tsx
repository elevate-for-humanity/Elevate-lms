import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, Building, GraduationCap, Briefcase, Heart, ArrowRight,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Ecosystem | Elevate For Humanity',
  description: 'Explore the Elevate ecosystem connecting learners, employers, training providers, and workforce boards.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ecosystem',
  },
};

const partners = [
  { icon: GraduationCap, title: 'Training Providers', count: '50+', description: 'Accredited programs and certifications' },
  { icon: Building, title: 'Employer Partners', count: '200+', description: 'Companies hiring our graduates' },
  { icon: Users, title: 'Workforce Boards', count: '15+', description: 'Regional workforce development partners' },
  { icon: Heart, title: 'Community Partners', count: '30+', description: 'Nonprofits and support organizations' },
];

export default function EcosystemPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Our Ecosystem' }]} />
        </div>
      </div>

      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">The Elevate Ecosystem</h1>
          <p className="text-xl text-blue-100 mb-8">A connected network of learners, employers, and partners working together to transform careers</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partners.map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <p.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{p.count}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-gray-600 text-sm">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Our Network</h2>
          <p className="text-gray-600 mb-8">Whether you're a training provider, employer, or community organization, there's a place for you in our ecosystem.</p>
          <Link href="/partners/join" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700">
            Become a Partner <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
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
