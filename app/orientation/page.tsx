import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/orientation',
  },
  title: 'Welcome to Your New Beginning | Elevate For Humanity',
  description:
    'Your journey to a debt-free career starts here. Learn what to expect, how to succeed, and why thousands have transformed their lives through our programs.',
};

export default async function OrientationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Orientation" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/business/team-2.jpg"
          alt="Orientation"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Welcome to Your New Beginning
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            You're about to start a journey that changes everything. No debt.
            Real skills. A career that's yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Programs
            </Link>
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
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  This Is Different
                </h2>
                <p className="text-black mb-4">
                  You've probably heard promises before. "Get trained fast."
                  "Start a new career." But then you see the price tag. Or the
                  fine print. Or the catch.
                </p>
                <p className="text-black mb-6">
                  Here's the truth: We don't charge you. We don't put you in
                  debt. We don't make money unless you succeed. This is 100%
                  free training, funded by workforce grants, because we believe
                  everyone deserves a real shot.
                </p>
                <p className="text-black mb-6 font-semibold">
                  What you're about to learn in orientation:
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
                    <span>
                      How the program actually works (no hidden costs)
                    </span>
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
                    <span>What to expect on day one (and every day after)</span>
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
                    <span>How to get the most out of your training</span>
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
                    <span>
                      What happens after you graduate (job placement, support)
                    </span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/business/team-3.jpg"
                  alt="Orientation"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  Week 1: The Basics
                </h3>
                <p className="text-black">
                  You'll meet your instructors, get your materials, and learn
                  the fundamentals. No one expects you to know everything. We
                  start from the beginning.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-brand-green-600"
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
                <h3 className="text-lg font-semibold mb-3">
                  Weeks 2-12: Hands-On
                </h3>
                <p className="text-black">
                  This is where it clicks. You'll practice, make mistakes, get
                  better. Your instructors are there every step. By week 12,
                  you'll be confident.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
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
                <h3 className="text-lg font-semibold mb-3">
                  Graduation & Beyond
                </h3>
                <p className="text-black">
                  You'll complete your training, update your resume, and we'll
                  help you find work. Most graduates are hired within 30 days.
                  You're not alone in this.
                </p>
              </div>
            </div>

            {/* Real Talk Section */}
            <div className="mt-16 bg-white rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                What Students Actually Say
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-black mb-4 italic">
                    "I thought I'd be the oldest person there. I wasn't. I
                    thought I'd be behind. I wasn't. Everyone starts somewhere.
                    The instructors actually care."
                  </p>
                  <p className="text-sm font-semibold text-black">
                    — Marcus, CNA Graduate
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-black mb-4 italic">
                    "I had a record. I thought no one would hire me. But they
                    helped me with my resume, practiced interviews with me, and
                    connected me with employers who gave me a chance."
                  </p>
                  <p className="text-sm font-semibold text-black">
                    — James, HVAC Technician
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-black mb-4 italic">
                    "I was working two part-time jobs with no benefits. Now I
                    have a career. I have insurance. I can actually plan for the
                    future."
                  </p>
                  <p className="text-sm font-semibold text-black">
                    — Sarah, Medical Assistant
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <p className="text-black mb-4 italic">
                    "The best part? No student loans. I graduated and started
                    working the next week. No debt hanging over me."
                  </p>
                  <p className="text-sm font-semibold text-black">
                    — David, Barber Apprentice
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              You Don't Need Permission to Change Your Life
            </h2>
            <p className="text-base md:text-lg text-white mb-8">
              You just need to show up. We'll handle the rest. No debt. No
              excuses. Just a real path forward.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
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
