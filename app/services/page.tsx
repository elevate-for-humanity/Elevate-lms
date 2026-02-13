import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Support Services | Elevate for Humanity',
  description:
    'Tax services, career counseling, job placement, and comprehensive support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/services',
  },
};

const services = [
  {
    title: 'Tax Services',
    description: 'Professional tax preparation and maximum refund guarantee',
    href: '/tax-services',
    image: '/images/heroes-hq/tax-refund-hero.jpg',
  },
  {
    title: 'Supersonic Fast Cash',
    description: 'Quick refund advances and fast cash services',
    href: '/supersonic-fast-cash',
    image: '/images/business/program-tax-preparation.jpg',
  },
  {
    title: 'Career Services',
    description: 'Resume building, interview prep, job search support',
    href: '/career-services',
    image: '/images/heroes-hq/career-services-hero.jpg',
  },
  {
    title: 'Career Center',
    description: 'Job boards, employer connections, placement assistance',
    href: '/career-center',
    image: '/images/heroes-hq/employer-hero.jpg',
  },
  {
    title: 'Career Fairs',
    description: 'Meet employers hiring our graduates',
    href: '/career-fair',
    image: '/images/team-hq/team-meeting.jpg',
  },
  {
    title: 'Academic Advising',
    description: 'One-on-one guidance to help you succeed',
    href: '/advising',
    image: '/images/testimonials-hq/person-4.jpg',
  },
  {
    title: 'Mentorship Program',
    description: 'Connect with industry professionals',
    href: '/mentorship',
    image: '/images/team-hq/instructor-1.jpg',
  },
  {
    title: 'Support Services',
    description: 'Transportation, childcare, barrier removal',
    href: '/support',
    image: '/images/heroes-hq/about-hero.jpg',
  },
  {
    title: 'Help Center',
    description: 'FAQs, guides, and support resources',
    href: '/help',
    image: '/images/heroes-hq/contact-hero.jpg',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Services' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px]">
        <Image
          src="/images/heroes/hero-homepage.jpg"
          alt="Support Services"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            Support Services
          </h1>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                    {service.title}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Need Help?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100"
            >
              Contact Us
            </Link>
            <Link
              href="/faq"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
