import Link from 'next/link';
import { Metadata } from 'next';
import { Heart, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Divorce Support | Rise Foundation',
  description: 'Support and resources for individuals navigating divorce and separation',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation/divorce-support',
  },
};

const defaultServices = [
  { title: 'Individual Counseling', description: 'One-on-one support through your transition' },
  { title: 'Co-Parenting Support', description: 'Guidance for healthy co-parenting relationships' },
  { title: 'Support Groups', description: 'Connect with others going through similar experiences' },
  { title: 'Financial Planning', description: 'Resources for managing finances during divorce' },
  { title: 'Children\'s Programs', description: 'Age-appropriate support for children' },
  { title: 'Legal Resources', description: 'Information about legal processes and rights' },
];

export default function DivorceSupportPage() {
  const displayServices = defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation', href: '/rise-foundation' }, { label: 'Divorce Support' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Divorce Support</h1>
          <p className="text-xl text-rose-100">
            Compassionate guidance through life's transitions
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/rise-foundation" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Rise Foundation
        </Link>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-600">
            Divorce is one of life's most challenging transitions. Our compassionate team 
            provides support, resources, and guidance to help you navigate this difficult 
            time and build a foundation for your next chapter.
          </p>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {displayServices.map((service: any, index: number) => (
              <div key={index} className="bg-rose-50 rounded-xl p-6">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <Heart className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">You Don't Have to Go Through This Alone</h3>
          <p className="text-gray-600 mb-6">
            Reach out today for a confidential consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-700 transition"
            >
              Get Support
            </Link>
            <a 
              href="/support"
              className="inline-flex items-center justify-center gap-2 border border-rose-600 text-rose-600 px-6 py-3 rounded-lg font-semibold hover:bg-rose-50 transition"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
