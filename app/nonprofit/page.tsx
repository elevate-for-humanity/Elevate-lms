import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Heart, Users, Sparkles, BookOpen, Calendar, Gift,
  Phone
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Nonprofit | Mental Wellness & Holistic Healing',
  description:
    'Welcome to Selfish Inc. Your Partner in Mental Wellness and Holistic Healing',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit',
  },
};

export const dynamic = 'force-dynamic';

export default async function NonprofitPage() {
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

  // Get nonprofit programs/services
  const { data: services } = await supabase
    .from('nonprofit_services')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get upcoming workshops
  const { data: workshops } = await supabase
    .from('workshops')
    .select('*')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(3);

  // Get testimonials
  const { data: testimonials } = await supabase
    .from('testimonials')
    .select('*')
    .eq('category', 'nonprofit')
    .eq('is_featured', true)
    .limit(3);

  const defaultServices = [
    {
      title: 'Mental Wellness',
      description: 'Counseling and support services for mental health and emotional well-being.',
      href: '/nonprofit/mental-wellness',
      icon: Heart,
    },
    {
      title: 'Supersonic Fast Cash',
      description: 'Quick financial assistance and emergency support services.',
      href: '/supersonic-fast-cash',
      icon: Gift,
    },
    {
      title: 'Free Job Training',
      description: 'Funded career training through WIOA for eligible participants. Healthcare, trades, technology.',
      href: '/programs',
      icon: BookOpen,
    },
    {
      title: 'Divorce Counseling',
      description: 'Supportive guidance through the challenges of divorce and separation.',
      href: '/nonprofit/divorce-counseling',
      icon: Users,
    },
    {
      title: 'Young Adult Wellness',
      description: 'Programs designed specifically for young adults navigating life transitions.',
      href: '/nonprofit/young-adult-wellness',
      icon: Sparkles,
    },
    {
      title: 'Workshops',
      description: 'Interactive workshops on mindfulness, healing, and personal growth.',
      href: '/nonprofit/workshops',
      icon: BookOpen,
    },
  ];

  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Selfish Inc"
              width={200}
              height={80}
              className="mx-auto"
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-black text-black mb-8 leading-tight">
            "Welcome to Selfish Inc. Your Partner in Mental Wellness and
            Holistic Healing"
          </h1>

          {/* Donate Button */}
          <div className="mb-12">
            <Link
              href="/nonprofit/donations"
              className="inline-block bg-blue-600 text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Donate
            </Link>
          </div>
        </div>
      </section>

      {/* Mind Body Spirit Image Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[400px] rounded-lg overflow-hidden border-4 border-gray-200">
              <Image
                src="/images/nonprofit/mind-body-spirit.jpg"
                alt="Mind, Body and spirit words engraved on zen stones"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden border-4 border-gray-200">
              <Image
                src="/images/nonprofit/rocks-resilience.webp"
                alt="Rocks of strength and resilience"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {displayServices.map((service: any, index: number) => {
              const IconComponent = service.icon || Heart;
              return (
                <Link
                  key={index}
                  href={service.href || '#'}
                  className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition group"
                >
                  <IconComponent className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition" />
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Workshops */}
      {workshops && workshops.length > 0 && (
        <section className="py-16 px-4 bg-blue-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Upcoming Workshops</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {workshops.map((workshop: any) => (
                <div key={workshop.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 mb-3">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {new Date(workshop.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{workshop.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{workshop.description}</p>
                  <Link
                    href={`/nonprofit/workshops/${workshop.id}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Learn More →
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/nonprofit/workshops"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                View All Workshops
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials && testimonials.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">What People Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial: any) => (
                <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-600 italic mb-4">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Meet the Founder */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Meet the Founder</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn about the vision and mission behind Selfish Inc. and our commitment 
            to mental wellness and holistic healing.
          </p>
          <Link
            href="/nonprofit/meet-the-founder"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Meet Our Founder
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Support Our Mission</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Your donation helps us provide mental wellness services and holistic healing 
            programs to those in need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/nonprofit/donations"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Donate Now
            </Link>
            <Link
              href="/nonprofit/sign-up"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Sign Up for Updates
            </Link>
          </div>
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
              href="mailto:elevate4humanityedu@gmail.com"
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
