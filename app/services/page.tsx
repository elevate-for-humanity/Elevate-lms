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
    image: '/images/pages/career-services.jpg',
  },
  {
    title: 'Supersonic Fast Cash',
    description: 'Quick refund advances and fast cash services',
    href: '/supersonic-fast-cash',
    image: '/images/pages/apply-employer-hero.jpg',
  },
  {
    title: 'Career Services',
    description: 'Resume building, interview prep, job search support',
    href: '/career-services',
    image: '/images/pages/homepage-why-elevate.jpg',
  },
  {
    title: 'Career Center',
    description: 'Job boards, employer connections, placement assistance',
    href: '/career-center',
    image: '/images/pages/comp-home-pathways-support.jpg',
  },
  {
    title: 'Career Fairs',
    description: 'Meet employers hiring our graduates',
    href: '/career-fair',
    image: '/images/pages/homepage-why-elevate.jpg',
  },
  {
    title: 'Academic Advising',
    description: 'One-on-one guidance to help you succeed',
    href: '/advising',
    image: '/images/pages/healthcare-grad.jpg',
  },
  {
    title: 'Mentorship Program',
    description: 'Connect with industry professionals',
    href: '/mentorship',
    image: '/images/pages/store-recommendations.jpg',
  },
  {
    title: 'Support Services',
    description: 'Transportation, childcare, barrier removal',
    href: '/support',
    image: '/images/pages/career-services.jpg',
  },
  {
    title: 'Help Center',
    description: 'FAQs, guides, and support resources',
    href: '/help',
    image: '/images/pages/career-services.jpg',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Services' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/services-page-1.jpg" alt="Support Services" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Support Services</h1>
          </div>
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
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-blue-600">
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
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Need Help?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white"
            >
              Contact Us
            </Link>
            <Link
              href="/faq"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-700"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
