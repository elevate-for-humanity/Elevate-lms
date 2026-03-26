import Link from 'next/link';
import { Metadata } from 'next';
import { Heart, Shield, Users, Phone, Circle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Trauma Recovery | Rise Foundation',
  description: 'Support and resources for trauma recovery and healing',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation/trauma-recovery',
  },
};

export default function TraumaRecoveryPage() {
  const services: any[] = [];
  const supportGroups: any[] = [];
  const testimonials: any[] = [];

  const defaultServices = [
    { title: 'Individual Counseling', description: 'One-on-one support with trained trauma specialists' },
    { title: 'Group Therapy', description: 'Connect with others on similar healing journeys' },
    { title: 'EMDR Therapy', description: 'Evidence-based treatment for trauma processing' },
    { title: 'Mindfulness Programs', description: 'Learn techniques for managing triggers and anxiety' },
    { title: 'Peer Support', description: 'Connect with trained peer support specialists' },
    { title: 'Family Support', description: 'Resources for families supporting loved ones' },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation', href: '/rise-foundation' }, { label: 'Trauma Recovery' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Trauma Recovery</h1>
          <p className="text-xl text-brand-blue-100">
            Supporting your journey to healing and wholeness
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
            We provide compassionate, evidence-based support for individuals recovering from trauma.
            Our programs focus on holistic healing, addressing mind, body, and spirit. You don't 
            have to walk this path alone.
          </p>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {displayServices.map((service: any, index: number) => (
              <div key={index} className="bg-brand-blue-50 rounded-xl p-6">
                <Circle className="w-6 h-6 text-brand-blue-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Support Groups */}
        {supportGroups && supportGroups.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Support Groups</h2>
            <div className="space-y-4">
              {supportGroups.map((group: any) => (
                <div key={group.id} className="bg-white border rounded-xl p-6">
                  <div className="flex items-center gap-2 text-brand-blue-600 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">{group.schedule}</span>
                  </div>
                  <h3 className="font-bold text-lg">{group.title}</h3>
                  <p className="text-gray-600 mt-1">{group.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Stories of Healing</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-white rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-8 text-center">
          <Heart className="w-12 h-12 text-brand-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Ready to Begin Your Healing Journey?</h3>
          <p className="text-gray-600 mb-6">
            Reach out today for a confidential consultation. We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Get Support
            </Link>
            <a 
              href="/support"
              className="inline-flex items-center justify-center gap-2 border border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
            >
              <Phone className="w-5 h-5" />
              Crisis Line
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
