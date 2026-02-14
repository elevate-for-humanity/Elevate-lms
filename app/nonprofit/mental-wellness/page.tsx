export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { Heart, Brain, Sparkles, Calendar, Circle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Mental Wellness | Selfish Inc.',
  description: 'Mental wellness programs and support services for mind, body, and spirit.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/mental-wellness',
  },
};

export default async function MentalWellnessPage() {
  let services: any[] | null = null;
  let workshops: any[] | null = null;
  let testimonials: any[] | null = null;

  try {
    const supabase = createPublicClient();
    if (supabase) {
      const [servicesRes, workshopsRes] = await Promise.all([
        supabase.from('nonprofit_services').select('*').eq('category', 'mental-wellness').eq('is_active', true).order('order', { ascending: true }),
        supabase.from('workshops').select('*').eq('category', 'mental-wellness').eq('is_active', true).gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(3),
      ]);
      services = servicesRes.data;
      workshops = workshopsRes.data;
      const testimonialsRes = await supabase.from('testimonials').select('*').eq('category', 'mental-wellness').eq('is_featured', true).limit(2);
      testimonials = testimonialsRes.data;
    }
  } catch {
    // Supabase unavailable — use defaults
  }

  const defaultServices = [
    { title: 'Mindfulness and Meditation', description: 'Learn techniques to calm your mind and find inner peace' },
    { title: 'Stress Management', description: 'Develop healthy coping strategies for life\'s challenges' },
    { title: 'Mental Health Counseling', description: 'One-on-one support from trained professionals' },
    { title: 'Wellness Coaching', description: 'Personalized guidance for your wellness journey' },
    { title: 'Group Therapy', description: 'Connect with others on similar journeys' },
    { title: 'Holistic Healing', description: 'Integrate mind, body, and spirit approaches' },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Mental Wellness' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Brain className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Mental Wellness</h1>
          <p className="text-xl text-brand-blue-100">
            Holistic programs for mind, body, and spirit
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/nonprofit" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Programs</h2>
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

        {/* Upcoming Workshops */}
        {workshops && workshops.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Upcoming Workshops</h2>
            <div className="space-y-4">
              {workshops.map((workshop: any) => (
                <div key={workshop.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex items-center gap-2 text-brand-blue-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(workshop.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{workshop.title}</h3>
                  <p className="text-gray-600 mt-1">{workshop.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">What People Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
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
          <h3 className="text-2xl font-bold mb-4">Start Your Wellness Journey</h3>
          <p className="text-gray-600 mb-6">
            Explore our workshops and programs designed to support your mental wellness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/nonprofit/workshops" 
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              View Workshops
            </Link>
            <Link 
              href="/contact" 
              className="border border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
