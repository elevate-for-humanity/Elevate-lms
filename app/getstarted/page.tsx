import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Get Started | Elevate For Humanity',
  description:
    'Start your career training today. Check eligibility for WIOA, WRG, or apprenticeship funding.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/getstarted',
  },
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Getstarted" }]} />
      </div>
{/* Hero Banner with Video */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="w-full h-full object-cover"
          >
            <source src="/videos/getting-started-hero.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-orange-400 mb-4">
              Begin Your Journey
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">
              Start Your Career Journey Today
            </h1>
            <p className="text-base md:text-lg mb-8 drop-shadow-lg text-white/95">
              Funded training. No cost, no debt. Real careers waiting. Get
              started in 3 simple steps.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="bg-brand-orange-600 text-white px-8 py-4 rounded-full font-bold hover:bg-brand-orange-700 text-lg shadow-2xl transition-all"
              >
                Contact Us
              </Link>
              <Link
                href="/programs"
                className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-slate-100 text-lg shadow-2xl transition-all border-2 border-white"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Your Journey - 3 Simple Steps */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold mb-4 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Your Path to a New Career
            </h2>
            <p className="text-base md:text-lg text-black">
              Three simple steps. No hidden costs. No complicated process. Just
              you and your future.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-brand-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg md:text-lg font-bold mb-4">
                Apply Online
              </h3>
              <p className="text-black mb-6 leading-relaxed">
                Fill out a simple application (takes 5 minutes). Tell us about
                yourself, what you're interested in, and what support you might
                need. No commitment required.
              </p>
              <Link
                href="/contact"
                className="text-brand-orange-600 font-semibold hover:underline"
              >
                Contact Us →
              </Link>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg md:text-lg font-bold mb-4">
                Meet Your Advisor
              </h3>
              <p className="text-black mb-6 leading-relaxed">
                Within 1-2 days, a real person will call you. They'll explain
                programs, help you check eligibility for free funding, and
                answer all your questions. No pressure, just guidance.
              </p>
              <p className="text-sm text-black">
                Contact us anytime:{' '}
                <a
                  href="/support"
                  className="text-brand-blue-600 font-semibold"
                >
                  support center
                </a>
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-brand-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg md:text-lg font-bold mb-4">
                Start Training
              </h3>
              <p className="text-black mb-6 leading-relaxed">
                Once approved, you'll start training—Funded. Learn new
                skills, earn credentials, and get connected to employers. We
                support you every step until you're hired.
              </p>
              <Link
                href="/programs"
                className="text-brand-green-600 font-semibold hover:underline"
              >
                View Programs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Why Thousands Choose Elevate
                </h2>
                <p className="text-lg text-black mb-6 leading-relaxed">
                  We're not just a training program—we're a community that
                  believes everyone deserves a shot at a better life, regardless
                  of their past or current situation.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <strong className="text-black">Zero Cost:</strong>
                      <span className="text-black">
                        {' '}
                        Government pays for everything—tuition, books, supplies,
                        even transportation and childcare support.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <strong className="text-black">
                        Real Credentials:
                      </strong>
                      <span className="text-black">
                        {' '}
                        State licenses and industry certifications that
                        employers actually hire for.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <strong className="text-black">Job Placement:</strong>
                      <span className="text-black">
                        {' '}
                        We don't stop at training—we connect you with employers
                        and support you through your first 90 days.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <strong className="text-black">
                        Second Chances Welcome:
                      </strong>
                      <span className="text-black">
                        {' '}
                        Re-entry? Past struggles? We don't judge—we help you
                        move forward.
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image alt="Getting started with Elevate" priority
                  src="/images/pages/getstarted-page-1.jpg"
                  alt="Training Facility"
                  fill
          sizes="100vw"
                  className="object-cover"
                  quality={90}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Why Choose Us
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Funding Available</h3>
                <p className="text-black">
                  Most participants qualify for full funding through WIOA, WRG, or JRI
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Job Placement</h3>
                <p className="text-black">
                  We help you find employment after training
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Expert Training</h3>
                <p className="text-black">
                  Learn from industry professionals
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
