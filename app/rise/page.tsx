import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/rise',
  },
  title:
    'RISE Foundation | Free Tax Preparation Training | IRS VITA Volunteer | Indianapolis',
  description:
    'RISE Foundation offers free IRS-certified tax preparation training. Become a VITA volunteer through IRS Link & Learn. Help low-income families get free tax help. IRS-approved training provider in Indianapolis.',
  keywords:
    'IRS VITA volunteer, free tax preparation training, IRS Link and Learn, VITA certification, volunteer income tax assistance, IRS certified tax preparer training, free tax help Indianapolis, VITA site Indianapolis, tax volunteer training, IRS approved training',
};

export default async function RiseFoundationPage() {
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
  
  // Fetch RISE Foundation info
  const { data: riseInfo } = await db
    .from('organizations')
    .select('*')
    .eq('slug', 'rise-foundation')
    .single();
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Rise" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden bg-slate-900">
        <Image
          src="/images/barber/gallery-1.jpg"
          alt="RISE Foundation"
          fill
          className="object-cover opacity-40"
          priority
          quality={100}
          sizes="100vw"
        />
      </section>

      {/* Mission Section */}
      <section className="py-40 px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-2xl md:text-3xl font-light text-black mb-6 text-3xl md:text-2xl md:text-3xl lg:text-3xl md:text-4xl">
              Our Mission
            </h2>
            <p className="text-base md:text-lg text-black max-w-3xl mx-auto">
              To empower individuals and communities through accessible
              education, workforce training, and comprehensive support services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-brand-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg md:text-lg font-semibold text-black mb-4">
                Education
              </h3>
              <p className="text-black">
                Free training programs in healthcare, beauty, trades, and
                technology
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg md:text-lg font-semibold text-black mb-4">
                Community
              </h3>
              <p className="text-black">
                Building stronger communities through support services and
                partnerships
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-brand-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg md:text-lg font-semibold text-black mb-4">
                Empowerment
              </h3>
              <p className="text-black">
                Helping individuals achieve economic independence and career
                success
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-40 px-12 bg-slate-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="text-2xl md:text-3xl font-light text-black mb-6 text-3xl md:text-2xl md:text-3xl lg:text-3xl md:text-4xl">
              Our Programs
            </h2>
            <p className="text-base md:text-lg text-black">
              Comprehensive training and support services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-700">
              <h3 className="text-3xl font-semibold text-black mb-4">
                IRS VITA Volunteer Training
              </h3>
              <p className="text-black mb-6">
                Become an IRS-certified tax preparer through our free VITA
                (Volunteer Income Tax Assistance) training program. Complete IRS
                Link & Learn certification and help low-income families file
                taxes for free.
              </p>
              <div className="space-y-3 mb-6">
                <a
                  href="https://www.irs.gov/individuals/irs-tax-volunteers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-brand-orange-600 font-semibold hover:underline"
                >
                  IRS Volunteer Signup →
                </a>
                <a
                  href="https://www.irs.gov/individuals/volunteers/link-learn-taxes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-brand-orange-600 font-semibold hover:underline"
                >
                  IRS Link & Learn Platform →
                </a>
                <Link
                  href="/programs/tax-preparation"
                  className="block text-brand-orange-600 font-semibold hover:underline"
                >
                  Our Tax Preparation Course →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-700">
              <h3 className="text-3xl font-semibold text-black mb-4">
                Support Services
              </h3>
              <p className="text-black mb-6">
                Comprehensive wraparound services including housing assistance,
                mental health support, childcare, and transportation.
              </p>
              <Link
                href="/students"
                className="text-brand-orange-600 font-semibold hover:underline"
              >
                Learn More →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-700">
              <h3 className="text-3xl font-semibold text-black mb-4">
                Apprenticeships
              </h3>
              <p className="text-black mb-6">
                DOL-registered apprenticeship programs where students earn while
                they learn, gaining real-world experience and industry-standard
                credentials.
              </p>
              <Link
                href="/programs/barber-apprenticeship"
                className="text-brand-orange-600 font-semibold hover:underline"
              >
                Explore Apprenticeships →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-md hover:shadow-xl transition-all duration-700">
              <h3 className="text-3xl font-semibold text-black mb-4">
                Community Partnerships
              </h3>
              <p className="text-black mb-6">
                Collaborating with employers, educational institutions, and
                community organizations to create pathways to success.
              </p>
              <Link
                href="/employers"
                className="text-brand-orange-600 font-semibold hover:underline"
              >
                Partner With Us →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-12 bg-slate-900">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-light mb-6 text-3xl md:text-2xl md:text-3xl lg:text-3xl md:text-4xl">
            Support Our Mission
          </h2>
          <p className="text-base md:text-lg text-slate-300 mb-12">
            Help us empower more individuals and strengthen communities through
            education and opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-600 transition text-lg"
            >
              Get Involved
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
