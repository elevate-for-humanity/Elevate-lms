import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/grievance',
  },
  title: 'Grievance Procedure | Elevate For Humanity',
  description:
    'File a grievance if you believe you were denied services, experienced discrimination, or were treated unfairly in our WIOA programs.',
};

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Grievance" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/pathways/business-hero.jpg"
          alt="Grievance"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            Grievance
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Transform your career with free training and industry certifications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/programs"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-black mb-8 text-2xl md:text-3xl lg:text-4xl">
          Grievance Procedure
        </h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Your Right to File a Grievance
          </h2>
          <p className="text-black mb-4">
            As a WIOA participant, you have the right to file a grievance if you
            believe:
          </p>
          <ul className="list-disc pl-6 mb-4 text-black space-y-2">
            <li>You were denied services you are entitled to</li>
            <li>You experienced discrimination</li>
            <li>Program rules were not followed</li>
            <li>You were treated unfairly</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            How to File a Grievance
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-2">
                Step 1: Informal Resolution
              </h3>
              <p className="text-black mb-2">
                Start to resolve the issue with your case manager or instructor
                first.
              </p>
              <p className="text-sm text-black">
                Timeline: Within 5 business days
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-2">
                Step 2: Formal Written Grievance
              </h3>
              <p className="text-black mb-2">
                If informal resolution doesn't work, submit a written grievance:
              </p>
              <ul className="list-disc pl-6 mb-2 text-black space-y-1">
                <li>Your name and contact information</li>
                <li>Description of the issue</li>
                <li>Date(s) the issue occurred</li>
                <li>Names of people involved</li>
                <li>What resolution you are seeking</li>
              </ul>
              <p className="text-sm text-black">
                Timeline: Within 30 days of the incident
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-2">
                Step 3: Investigation
              </h3>
              <p className="text-black mb-2">
                We will investigate your grievance and provide a written
                response.
              </p>
              <p className="text-sm text-black">
                Timeline: Within 30 days of receiving your grievance
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-black mb-2">
                Step 4: Appeal
              </h3>
              <p className="text-black mb-2">
                If you disagree with our decision, you can appeal to the state
                workforce board.
              </p>
              <p className="text-sm text-black">
                Timeline: Within 15 days of receiving our decision
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Submit Your Grievance
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-black mb-2">Mail:</p>
                <p className="text-black">
                  Grievance Officer
                  <br />
                  Elevate for Humanity
                  <br />
                  Indianapolis, IN
                </p>
              </div>
              <div>
                <p className="font-semibold text-black mb-2">Email:</p>
                <p className="text-black">
                  <a
                    href="mailto:elevate4humanityedu@gmail.com"
                    className="text-brand-blue-600 hover:underline"
                  >
                    elevate4humanityedu@gmail.com
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold text-black mb-2">Phone:</p>
                <p className="text-black">
                  <a
                    href="/support"
                    className="text-brand-blue-600 hover:underline"
                  >
                    Get Help Online
                  </a>
                </p>
              </div>
              <div>
                <p className="font-semibold text-black mb-2">In Person:</p>
                <p className="text-black">
                  Visit our office Monday-Friday, 9am-5pm
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            No Retaliation
          </h2>
          <p className="text-black mb-4">
            You will not face retaliation for filing a grievance. Your services
            will continue while your grievance is being resolved.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Additional Support
          </h2>
          <p className="text-black mb-4">
            If you need assistance filing a grievance or have questions about
            the process, contact:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-black">
              <strong className="text-black">
                Student Support Services
              </strong>
              <br />
              Phone:{' '}
              <a
                href="/support"
                className="text-brand-blue-600 hover:underline"
              >
                Get Help Online
              </a>
              <br />
              Email:{' '}
              <a
                href="mailto:elevate4humanityedu@gmail.com"
                className="text-brand-blue-600 hover:underline"
              >
                elevate4humanityedu@gmail.com
              </a>
            </p>
          </div>
        </section>

        <div className="text-sm text-black mt-8 pt-8 border-t">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          <p>Effective Date: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
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
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
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
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
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
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-6 h-6 text-brand-green-600 mr-3 flex-shrink-0 mt-1"
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
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/trades/program-construction-training.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Improve Your Career?
              </h2>
              <p className="text-base md:text-lg mb-8 text-blue-100">
                Join thousands who have launched successful careers through our
                free training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
