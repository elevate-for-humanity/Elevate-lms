import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'How It Works | Elevate for Humanity',
  description:
    'Learn how Elevate for Humanity helps you get trained, certified, and hired.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/how-it-works',
  },
};

const steps = [
  {
    step: 1,
    title: 'Apply',
    description: 'Complete a simple online application or contact us.',
    image: '/images/success-new/success-1.jpg',
    href: '/apply',
  },
  {
    step: 2,
    title: 'Get Matched',
    description: 'We connect you with the right training program.',
    image: '/images/success-new/success-2.jpg',
    href: '/programs',
  },
  {
    step: 3,
    title: 'Train',
    description: 'Complete your training with hands-on instruction.',
    image: '/images/success-new/success-3.jpg',
    href: '/programs',
  },
  {
    step: 4,
    title: 'Get Hired',
    description: 'Earn your credential and connect with employers.',
    image: '/images/success-new/success-4.jpg',
    href: '/career-services',
  },
];

const resources = [
  {
    title: 'WIOA Eligibility',
    description: 'Find out if you qualify for free training.',
    image: '/images/heroes-hq/funding-hero.jpg',
    href: '/wioa-eligibility',
  },
  {
    title: 'Funding Options',
    description: 'Learn about grants and payment options.',
    image: '/images/heroes-hq/career-services-hero.jpg',
    href: '/funding',
  },
  {
    title: 'Training Programs',
    description: 'Explore healthcare, trades, technology, and more.',
    image: '/images/heroes-hq/programs-hero.jpg',
    href: '/programs',
  },
  {
    title: 'FAQ',
    description: 'Get answers to common questions.',
    image: '/images/heroes-hq/contact-hero.jpg',
    href: '/faq',
  },
];

const programs = [
  {
    title: 'Healthcare',
    description: 'CNA, Medical Assistant, Phlebotomy',
    image: '/images/healthcare/hero-programs-healthcare.jpg',
    href: '/programs/healthcare',
  },
  {
    title: 'Skilled Trades',
    description: 'HVAC, Electrical, Welding, Plumbing',
    image: '/images/trades/hero-program-hvac.jpg',
    href: '/programs/skilled-trades',
  },
  {
    title: 'Technology',
    description: 'IT Support, Cybersecurity, Web Development',
    image: '/images/technology/hero-program-it-support.jpg',
    href: '/programs/technology',
  },
  {
    title: 'CDL Training',
    description: 'Commercial Driver License',
    image: '/images/trades/hero-program-cdl.jpg',
    href: '/programs/cdl-training',
  },
  {
    title: 'Barber Apprenticeship',
    description: 'USDOL Registered Program',
    image: '/images/barber/training.jpg',
    href: '/programs/barber-apprenticeship',
  },
  {
    title: 'Business',
    description: 'Tax Preparation, Entrepreneurship',
    image: '/images/heroes/hero-state-funding.jpg',
    href: '/programs/business',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'How It Works' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center">
        <Image
          src="/images/heroes-hq/how-it-works-hero.jpg"
          alt="Career training"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">Your path to a new career in 4 simple steps</p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Resources
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-40">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Training Programs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="relative h-52">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700"
            >
              Contact Us
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-4">
            After applying, a workforce advisor will confirm your eligibility and start date.
          </p>
        </div>
      </section>
    </div>
  );
}
