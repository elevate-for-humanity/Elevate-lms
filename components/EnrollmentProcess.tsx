import Image from 'next/image';
import Link from 'next/link';

export default function EnrollmentProcess() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-4">
            How to Enroll - Step by Step
          </h2>
          <p className="text-lg sm:text-xl text-black max-w-3xl mx-auto">
            Follow these simple steps to start your free training through Indiana Career Connect
          </p>
        </div>

        {/* Step-by-Step Process */}
        <div className="space-y-8 max-w-4xl mx-auto">

          {/* Step 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20    rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-3">
                Visit Indiana Career Connect
              </h3>
              <p className="text-black mb-4 leading-relaxed">
                Go to <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer"
className="text-brand-orange-700 font-semibold hover:underline">www.indianacareerconnect.com</a> and create your free account. This is the official portal for all WIOA-funded training programs in Indiana.
              </p>
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-brand-orange-700 text-white font-bold rounded-full hover:bg-brand-orange-800 transition-all"
              >
                Go to Indiana Career Connect →
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20    rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-3">
                Complete Your Profile
              </h3>
              <p className="text-black mb-4 leading-relaxed">
                Fill out your profile with your work history, education, and career goals. This helps us match you with the right training program and funding options.
              </p>
              <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-4 rounded">
                <p className="text-sm text-black">
                  <strong>What you'll need:</strong> Social Security Number, proof of residency, income documentation (if applicable), and high school diploma or GED.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-brand-orange-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-3">
                Schedule Your Appointment
              </h3>
              <p className="text-black mb-4 leading-relaxed">
                Book an appointment with a career advisor through the Indiana Career Connect portal. They will review your eligibility for WIOA funding and help you choose the right program.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-2">📍 In-Person</h4>
                  <p className="text-sm text-black">Visit a WorkOne center near you</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-bold text-black mb-2">💻 Virtual</h4>
                  <p className="text-sm text-black">Schedule a video call appointment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-brand-orange-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-3">
                Meet with Your Advisor
              </h3>
              <p className="text-black mb-4 leading-relaxed">
                Your career advisor will verify your eligibility, explain funding options, and help you select Elevate for Humanity as your training provider. They'll also discuss supportive services like transportation and childcare assistance.
              </p>
              <div className="bg-brand-green-50 border-l-4 border-brand-green-600 p-4 rounded">
                <p className="text-sm text-black">
                  <strong>Tip:</strong> Mention you want to train with Elevate for Humanity. We're an approved WIOA provider in Marion County.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 flex gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-brand-orange-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                5
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-black mb-3">
                Get Approved & Enroll
              </h3>
              <p className="text-black mb-4 leading-relaxed">
                Once approved for WIOA funding, your advisor will issue a training voucher. Bring this to Elevate for Humanity to complete your enrollment. We'll handle all the paperwork and get you started!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Link
                  href="/contact"
                  className="inline-block px-6 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-all text-center"
                >
                  Contact Us for Help
                </Link>
                <a
                  href="/support"
                  className="inline-block px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-50 transition-all border-2 border-slate-200 text-center"
                >
                  Call support center
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Help */}
        <div className="mt-12 bg-brand-orange-700 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Need Help with the Process?</h3>
          <p className="text-lg mb-6 max-w-2xl mx-auto text-white">
            Our team can guide you through every step of the Indiana Career Connect process. We're here to make enrollment as easy as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block px-8 py-4 bg-white text-brand-orange-700 font-bold rounded-full hover:bg-slate-50 transition-all"
            >
              Email Us
            </a>
            <Link
              href="/advising"
              className="inline-block px-8 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white hover:bg-white hover:text-brand-orange-700 transition-all"
            >
              Schedule Advising Call
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">📋</div>
            <h4 className="font-bold text-black mb-2">Eligibility Requirements</h4>
            <p className="text-sm text-black mb-4">Check if you qualify for WIOA funding</p>
            <Link href="/wioa-eligibility" aria-label="Link" className="text-brand-orange-700 font-semibold hover:underline">
              Learn More →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">🏢</div>
            <h4 className="font-bold text-black mb-2">Find WorkOne Center</h4>
            <p className="text-sm text-black mb-4">Locate your nearest WorkOne office</p>
            <a
              href="https://www.in.gov/dwd/workone-centers/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-orange-700 font-semibold hover:underline"
            >
              Find Location →
            </a>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-4xl mb-3 text-2xl md:text-3xl lg:text-4xl">💰</div>
            <h4 className="font-bold text-black mb-2">Funding Options</h4>
            <p className="text-sm text-black mb-4">Learn about WIOA, WRG, and JRI funding</p>
            <Link href="/funding" aria-label="Link" className="text-brand-orange-700 font-semibold hover:underline">
              View Options →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
