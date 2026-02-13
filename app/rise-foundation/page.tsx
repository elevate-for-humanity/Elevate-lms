import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'The Rise Foundation | A DBA of Selfish Inc. 501(c)(3) | Free VITA Tax Services & Mental Wellness',
  description: 'The Rise Foundation, a DBA of Selfish Inc. 501(c)(3), provides free VITA tax preparation, mental wellness support, trauma recovery, and community services in Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise-foundation',
  },
};

export const dynamic = 'force-dynamic';

export default async function RiseFoundationPage() {
  let programs = null;
  let peopleHelped = null;
  let events = null;
  let testimonials = null;

  try {
    const supabase = await createClient();
    if (supabase) {
      // Get programs
      const { data: programsData } = await supabase
        .from('rise_programs')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
      programs = programsData;

      // Get stats
      const { count } = await supabase
        .from('rise_participants')
        .select('*', { count: 'exact', head: true });
      peopleHelped = count;

      // Get upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organization', 'rise-foundation')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);
      events = eventsData;

      // Get testimonials
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_featured', true)
        .limit(3);
      testimonials = testimonialsData;
    }
  } catch (error) {
    console.error('Error fetching Rise Foundation data:', error);
  }

  const defaultPrograms = [
    {
      id: '1',
      title: 'Trauma Recovery',
      description: 'Comprehensive support for individuals healing from traumatic experiences. Individual and group therapy options available.',
      icon: 'heart',
      href: '/rise-foundation/trauma-recovery',
      image_url: '/images/rise-foundation/emergency-fund.jpg',
    },
    {
      id: '2',
      title: 'Divorce Support',
      description: 'Navigate the challenges of divorce with professional guidance. Support groups, counseling, and practical resources.',
      icon: 'users',
      href: '/rise-foundation/divorce-support',
      image_url: '/images/rise-foundation/childcare.jpg',
    },
    {
      id: '3',
      title: 'Addiction Rehabilitation',
      description: 'Evidence-based recovery programs for substance abuse. Outpatient services, support groups, and aftercare planning.',
      icon: 'sparkles',
      href: '/rise-foundation/addiction-rehabilitation',
      image_url: '/images/rise-foundation/transportation.jpg',
    },
    {
      id: '4',
      title: 'Mental Wellness',
      description: 'Holistic mental health support including counseling, workshops, and wellness programs for lasting wellbeing.',
      icon: 'shield',
      href: '/rise-foundation/mental-wellness',
      image_url: '/images/rise-foundation/housing.jpg',
    },
  ];

  const displayPrograms = programs && programs.length > 0 ? programs : defaultPrograms;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Rise Foundation' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[500px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/rise-foundation/hero.jpg)' }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-pink-400" />
            <span className="text-pink-200 font-medium">The Rise Foundation — A DBA of Selfish Inc. 501(c)(3)</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Community Support Starts Here
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-8">
            Free VITA tax preparation, mental wellness support, trauma recovery, and community education. 
            Serving Indiana families with compassion and dignity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/rise-foundation/get-involved"
              className="inline-flex items-center justify-center gap-2 bg-pink-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-pink-600"
            >
              Get Support <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/donate"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-100"
            >
              <Heart className="w-5 h-5" /> Donate
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600">{peopleHelped || 500}+</div>
              <div className="text-gray-600">People Helped</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">4</div>
              <div className="text-gray-600">Core Programs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">Crisis Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">100%</div>
              <div className="text-gray-600">Confidential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive support services designed to help you heal, grow, and thrive.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {displayPrograms.map((program: any) => (
              <Link
                key={program.id}
                href={program.href || `/rise-foundation/${program.slug}`}
                className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-56 relative">
                  {program.image_url ? (
                    <img
                      src={program.image_url}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700" />
                  )}
                  
                  <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white">
                    {program.title}
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <span className="inline-flex items-center gap-1 text-blue-600 font-medium group-hover:underline">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Stories of Hope</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <p className="font-medium">- {testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      {events && events.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((event: any) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-2 text-blue-600 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm">{event.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help? We're Here</h2>
          <p className="text-xl text-blue-100 mb-8">
            Our compassionate team is here to support you. All services are confidential.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/rise-foundation/get-involved"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100"
            >
              Get Started
            </Link>
            <a
              href="mailto:elevate4humanityedu@gmail.com"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-400 border-2 border-white"
            >
              <Phone className="w-5 h-5" /> Get Help
            </a>
          </div>
          <p className="text-blue-200 text-sm">
            Crisis Line Available 24/7 • All Services Confidential
          </p>
        </div>
      </section>
    </div>
  );
}
