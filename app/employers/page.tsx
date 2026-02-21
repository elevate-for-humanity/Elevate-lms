
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users,
  Award,
  DollarSign,
  Clock,
  ArrowRight,
  Phone,
  Building2,
CheckCircle, } from 'lucide-react';
import EmployerPartners from '@/components/EmployerPartners';

export const metadata: Metadata = {
  title: 'For Employers | Elevate for Humanity',
  description:
    'Hire trained, certified candidates ready to work. Build apprenticeships, access talent pipelines, and grow your workforce.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers',
  },
  openGraph: {
    title: 'For Employers | Elevate for Humanity',
    description: 'Hire trained, certified candidates ready to work. Build apprenticeships, access talent pipelines, and grow your workforce.',
    url: 'https://www.elevateforhumanity.org/employers',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes/workforce-partner-2.jpg', width: 1200, height: 630, alt: 'Employer partnerships' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Employers | Elevate for Humanity',
    description: 'Hire trained, certified candidates. Build apprenticeships and access talent pipelines.',
    images: ['/images/heroes/workforce-partner-2.jpg'],
  },
};

export default function EmployersPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'For Employers' }]} />
        </div>
      </div>

      {/* Hero with Image */}
      <section className="relative min-h-[550px] flex items-center overflow-hidden">
        <Image
          src="/images/heroes/workforce-partner-2.jpg"
          alt="Partner with Elevate for Humanity"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="inline-flex items-center gap-2 bg-brand-orange-100 text-brand-orange-800 px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Building2 className="w-4 h-4" />
              For Employers
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
              Hire Trained, Certified Candidates
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Access a pipeline of job-ready talent who have completed hands-on training 
              and earned industry credentials. No recruiting fees. No guesswork.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact?type=employer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Partner With Us
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="/support"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5" />
                Get Help Online
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}

      {/* Quick Links */}
      <section className="py-6 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/hire-graduates" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Hire Graduates
            </Link>
            <Link href="/ojt-and-funding" className="px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium hover:bg-brand-green-200 transition-colors">
              OJT & Funding
            </Link>
            <Link href="/workforce-partners" className="px-4 py-2 bg-brand-blue-100 text-brand-blue-800 rounded-full text-sm font-medium hover:bg-brand-blue-200 transition-colors">
              Workforce Partners
            </Link>
            <Link href="/programs" className="px-4 py-2 bg-brand-orange-100 text-brand-orange-800 rounded-full text-sm font-medium hover:bg-brand-orange-200 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Why Employers Partner With Us
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We solve your hiring challenges by providing trained, vetted candidates 
            who are ready to contribute from day one.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Pre-Screened Talent',
                description: 'Candidates have completed training and demonstrated commitment.',
                image: '/images/heroes/employer-partner-3.jpg',
              },
              {
                title: 'Certified Skills',
                description: 'Industry-recognized credentials verify their competency.',
                image: '/images/employers/partnership-handshake.jpg',
              },
              {
                title: 'No Recruiting Fees',
                description: 'Access our talent pipeline at no cost to your organization.',
                image: '/images/heroes/workforce-partner-2.jpg',
              },
              {
                title: 'Faster Onboarding',
                description: 'Trained candidates require less ramp-up time.',
                image: '/images/homepage/employer-partnership.png',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl overflow-hidden shadow-sm border">
                <div className="relative h-32">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Tell Us Your Needs',
                description: 'Share your hiring requirements, timeline, and the skills you need.',
              },
              {
                step: 2,
                title: 'We Match Candidates',
                description: 'We connect you with trained candidates who fit your criteria.',
              },
              {
                step: 3,
                title: 'You Hire',
                description: 'Interview and hire candidates directly. No middleman fees.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-brand-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apprenticeship Option */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Building2 className="w-12 h-12 text-brand-orange-400 mb-4" />
                <h2 className="text-3xl font-bold mb-4">
                  Host an Apprentice
                </h2>
                <p className="text-gray-300 mb-6">
                  Become a host site for our barber apprenticeship program. Train the next 
                  generation while building your team. Apprentices complete 1,500 hours of 
                  supervised training at your shop.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Train talent to your standards',
                    'Build loyalty before they are licensed',
                    'Contribute to the profession',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact?type=host-shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-semibold rounded-full transition-colors"
                >
                  Become a Host Shop
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 rounded-2xl p-6">
                  <h3 className="font-semibold mb-4">Apprenticeship Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span>1,500 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credential</span>
                      <span>State Barber License</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Your Role</span>
                      <span>Supervise & Train</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cost to You</span>
                      <span>None</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employer Partners Section */}
      <EmployerPartners variant="full" showStats={true} showCTA={false} />

      {/* CTA */}
      <section className="py-20 bg-brand-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build Your Team?
          </h2>
          <p className="text-xl text-brand-orange-100 mb-8">
            Contact us to discuss your hiring needs and access our talent pipeline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=employer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-orange-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-orange-700 text-white font-semibold rounded-full hover:bg-brand-orange-800 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
