import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Young Adult Wellness | Selfish Inc.',
  description: 'Programs designed specifically for young adults navigating life transitions.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/young-adult-wellness',
  },
};

export const dynamic = 'force-dynamic';

export default async function YoungAdultWellnessPage() {
  const supabase = await createClient();

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

  // Get young adult services
  const { data: services } = await supabase
    .from('nonprofit_services')
    .select('*')
    .eq('category', 'young-adult')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('category', 'young-adult')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(3);

  // Get testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('category', 'young-adult')
    .eq('is_featured', true)
    .limit(2);

  const defaultServices = [
    { title: 'Life Skills Workshops', description: 'Practical skills for adulting - finances, cooking, self-care' },
    { title: 'Career Exploration', description: 'Discover your passions and career possibilities' },
    { title: 'Peer Support Groups', description: 'Connect with others your age facing similar challenges' },
    { title: 'Mental Health Support', description: 'Counseling tailored to young adult concerns' },
    { title: 'Relationship Skills', description: 'Build healthy relationships and communication skills' },
    { title: 'Identity & Purpose', description: 'Explore who you are and what matters to you' },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Young Adult Wellness' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-teal-500 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Young Adult Wellness</h1>
          <p className="text-xl text-teal-100">
            Programs for ages 18-30 navigating life's transitions
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/nonprofit" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        {/* Introduction */}
        <section className="mb-12">
          <p className="text-lg text-gray-600">
            The transition to adulthood comes with unique challenges. Our programs are 
            designed specifically for young adults (18-30) who are navigating career 
            decisions, relationships, identity, and independence.
          </p>
        </section>

        {/* Services */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Programs</h2>
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

        {/* Upcoming Events */}
        {events && events.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            <div className="space-y-4">
              {events.map((event: any) => (
                <div key={event.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex items-center gap-2 text-teal-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg">{event.title}</h3>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">What Young Adults Say</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                  {testimonial.age && (
                    <div className="text-sm text-teal-600">Age {testimonial.age}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center">
          <Sparkles className="w-12 h-12 text-teal-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Ready to Thrive?</h3>
          <p className="text-gray-600 mb-6">
            Join our community of young adults building meaningful lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/nonprofit/workshops" 
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition"
            >
              View Workshops
            </Link>
            <Link 
              href="/nonprofit/sign-up" 
              className="inline-flex items-center justify-center gap-2 border border-teal-600 text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition"
            >
              Sign Up for Updates <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
