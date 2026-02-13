import Image from 'next/image';
import Link from 'next/link';

interface ProgramCTAProps {
  programName?: string;
}

export default function ProgramCTA({ programName = "this program" }: ProgramCTAProps) {
  return (
    <>
      {/* Main CTA with Image */}
      <section className="py-16 sm:py-20   ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your Career?
              </h2>
              <p className="text-xl mb-8 text-orange-50">
                Join {programName} and get 100% free training through WIOA funding. No tuition, no debt, just career opportunities.
              </p>

              {/* Highlights with Icons */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/hero-training.jpg"
                      alt="Free training"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">100% Free Training</h3>
                    <p className="text-orange-50">Fully funded through WIOA, WRG, and JRI programs</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/hero/hero-career-services.jpg"
                      alt="Job placement"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Job Placement Support</h3>
                    <p className="text-orange-50">We help you find employment after graduation</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/hero/hero-hands-on-training.jpg"
                      alt="Hands-on training"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Hands-On Training</h3>
                    <p className="text-orange-50">Real-world experience with industry professionals</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply"
                  className="inline-block px-8 py-4 bg-white text-orange-600 font-bold rounded-full hover:bg-orange-50 transition-all shadow-xl text-center text-lg"
                >
                  Apply Now - Free Training
                </Link>
                <a
                  href="/support"
                  className="inline-block px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white hover:bg-white hover:text-orange-600 transition-all text-center text-lg"
                >
                  Call 317-314-3757
                </a>
              </div>
            </div>

            <div className="relative h-[400px] sm:h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/hero/hero-hands-on-training.jpg"
                alt="Students in training"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA - Indiana Career Connect */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden shadow-2xl order-2 md:order-1">
              <Image
                src="/images/hero/hero-main-welcome.jpg"
                alt="Indiana Career Connect"
                fill
                className="object-cover"
              />
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Start at Indiana Career Connect
              </h2>
              <p className="text-xl mb-6 text-slate-300">
                All WIOA-funded training starts with Indiana Career Connect. Create your account, schedule an appointment, and get approved for free training.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold">1</div>
                  <p className="text-slate-300">Create account at IndianaCareerConnect.com</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold">2</div>
                  <p className="text-slate-300">Schedule appointment with career advisor</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold">3</div>
                  <p className="text-slate-300">Get approved for WIOA funding</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center font-bold">4</div>
                  <p className="text-slate-300">Enroll with Elevate for Humanity</p>
                </div>
              </div>

              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 transition-all shadow-xl text-lg"
              >
                Go to Indiana Career Connect →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Tertiary CTA - Support Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
              We Support Your Success
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Beyond training, we provide comprehensive support to help you succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Support 1 */}
            <div className="bg-slate-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src="/images/hero/hero-career-services.jpg"
                  alt="Career counseling"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-3">Career Counseling</h3>
                <p className="text-black mb-4">
                  One-on-one guidance to help you choose the right career path and achieve your goals.
                </p>
                <Link href="/advising" aria-label="Link" className="text-orange-600 font-semibold hover:underline">
                  Schedule Counseling →
                </Link>
              </div>
            </div>

            {/* Support 2 */}
            <div className="bg-slate-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src="/images/hero/hero-main-welcome.jpg"
                  alt="Job placement"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-3">Job Placement</h3>
                <p className="text-black mb-4">
                  We connect you with employers actively hiring in your field. Resume help and interview prep included.
                </p>
                <Link href="/employers" aria-label="Link" className="text-orange-600 font-semibold hover:underline">
                  View Employers →
                </Link>
              </div>
            </div>

            {/* Support 3 */}
            <div className="bg-slate-50 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src="/images/hero/hero-hands-on-training.jpg"
                  alt="Supportive services"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-black mb-3">Supportive Services</h3>
                <p className="text-black mb-4">
                  Transportation assistance, childcare support, and other services to help you complete training.
                </p>
                <Link href="/support" aria-label="Link" className="text-orange-600 font-semibold hover:underline">
                  Learn More →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Contact */}
      <section className="py-16 sm:py-20 bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Questions? We're Here to Help
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Our team is ready to answer your questions and guide you through the enrollment process.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">📞</div>
              <h3 className="font-bold mb-2">Call Us</h3>
              <a href="/support" className="text-blue-100 hover:text-white">
                317-314-3757
              </a>
            </div>
            <div className="bg-blue-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">✉️</div>
              <h3 className="font-bold mb-2">Email Us</h3>
              <a href="mailto:info@www.elevateforhumanity.org" className="text-blue-100 hover:text-white">
                info@www.elevateforhumanity.org
              </a>
            </div>
            <div className="bg-blue-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">📍</div>
              <h3 className="font-bold mb-2">Visit Us</h3>
              <p className="text-blue-100 text-sm">
                8888 Keystone Crossing<br/>Suite 1300<br/>Indianapolis, IN 46240
              </p>
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-blue-700 font-bold rounded-full hover:bg-gray-50 transition-all shadow-xl text-lg"
          >
            Contact Us Today
          </Link>
        </div>
      </section>
    </>
  );
}
