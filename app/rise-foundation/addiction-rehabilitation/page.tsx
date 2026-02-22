import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Heart, Shield, Phone, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Addiction Rehabilitation | Rise Forward Foundation',
  description: 'Support and resources for addiction recovery and rehabilitation',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation/addiction-rehabilitation',
  },
};

export const dynamic = 'force-dynamic';

export default async function AddictionRehabilitationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get addiction services
  const { data: services } = await db
    .from('foundation_services')
    .select('*')
    .eq('category', 'addiction')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get support groups
  const { data: supportGroups } = await db
    .from('support_groups')
    .select('*')
    .eq('category', 'addiction')
    .eq('is_active', true);

  // Get testimonials
  const { data: testimonials } = await db
    .from('testimonials')
    .select('*')
    .eq('category', 'addiction-recovery')
    .eq('is_featured', true)
    .limit(2);

  const defaultServices = [
    { title: 'Assessment & Intake', description: 'Comprehensive evaluation to create your personalized recovery plan' },
    { title: 'Individual Counseling', description: 'One-on-one support with addiction specialists' },
    { title: 'Group Therapy', description: 'Connect with others on the recovery journey' },
    { title: 'Family Programs', description: 'Support and education for families' },
    { title: 'Peer Support', description: 'Connect with trained recovery coaches' },
    { title: 'Aftercare Planning', description: 'Long-term support for sustained recovery' },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation', href: '/rise-foundation' }, { label: 'Addiction Rehabilitation' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Addiction Rehabilitation</h1>
          <p className="text-xl text-teal-100">
            Supporting your journey to recovery and renewed life
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/rise-foundation" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Rise Forward Foundation
        </Link>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-600">
            Recovery is possible. Our evidence-based programs provide the support, tools, 
            and community you need to overcome addiction and build a fulfilling life in 
            recovery. We believe in treating the whole person - mind, body, and spirit.
          </p>
        </section>

        {/* Crisis Banner */}
        <section className="mb-12 bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <Phone className="w-8 h-8 text-brand-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-brand-red-800">Need Immediate Help?</h3>
              <p className="text-brand-red-700">
                If you or someone you know is in crisis, call the SAMHSA National Helpline: 
                <a href="tel:1-800-662-4357" className="font-bold ml-1">1-800-662-4357</a>
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {displayServices.map((service: any, index: number) => (
              <div key={index} className="bg-teal-50 rounded-xl p-6">
                <span className="text-slate-400 flex-shrink-0">•</span>
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
                  <div className="flex items-center gap-2 text-teal-600 mb-2">
                    <Calendar className="w-5 h-5" />
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
            <h2 className="text-2xl font-bold mb-6">Stories of Recovery</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                  {testimonial.years_sober && (
                    <div className="text-sm text-teal-600">{testimonial.years_sober} years in recovery</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center">
          <Heart className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Get Help Today</h3>
          <p className="text-gray-600 mb-6">
            Recovery begins with a single step. Reach out today for a confidential assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              Get Help Now
            </Link>
            <a 
              href="/support"
              className="inline-flex items-center justify-center gap-2 border border-teal-600 text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition"
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
