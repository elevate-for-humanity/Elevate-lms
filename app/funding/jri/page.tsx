import { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';

import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/jri',
  },
  title: 'Justice Reinvestment Initiative (JRI) | Reentry Training | Elevate For Humanity',
  description:
    'Justice Reinvestment Initiative funding information.',
};

export default async function JriPage() {
  const supabase = createPublicClient();

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
  
  // Fetch JRI funding info
  const { data: jriInfo } = await supabase
    .from('funding_options')
    .select('*')
    .eq('type', 'jri')
    .single();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'JRI' }]} />
        </div>
      </div>

      {/* Hero Section - No Overlay */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/heroes-hq/jri-hero.jpg"
          alt="Justice Reinvestment Initiative - Second Chance Career Training"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
              Justice Reinvestment Initiative
            </h1>
            <p className="text-lg md:text-xl mb-6 text-gray-700">
              Free career training for justice-involved individuals. Your past doesn&apos;t define your future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply?program=jri"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Apply Now - It&apos;s Free
              </Link>
              <Link
                href="/programs"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">JRI</h2>
                <p className="text-black mb-6">
                  Access your dashboard and
                  development.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-6 h-6 text-brand-green-600 mr-2 flex-shrink-0 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/trades/program-construction-training.jpg"
                  alt="JRI"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards with Pictures */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src="/images/hero/hero-hands-on-training.jpg"
                    alt="Hands-on training"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Learn</h3>
                  <p className="text-gray-600">
                    Get hands-on training in barbering, CDL, healthcare, construction, and more.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src="/images/programs/cna-hero.jpg"
                    alt="Earn certifications"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Certify</h3>
                  <p className="text-gray-600">
                    Earn industry-recognized certifications and licenses that employers want.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src="/images/funding/funding-jri-program-v2.jpg"
                    alt="Get hired"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">Work</h3>
                  <p className="text-gray-600">
                    Get job placement support and connect with employers who hire JRI graduates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Join thousands who have launched successful careers through our
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
