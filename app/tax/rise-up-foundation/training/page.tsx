import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Volunteer Training - IRS Link & Learn | Rise Up Foundation',
  description:
    'Complete IRS Link & Learn Taxes training to become a certified VITA volunteer. Free online training with certification exam.',
  keywords: [
    'IRS Link and Learn',
    'VITA training',
    'tax volunteer training',
    'IRS certification',
    'volunteer tax preparer',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/tax/rise-up-foundation/training',
  },
  openGraph: {
    title: 'Volunteer Training - IRS Link & Learn',
    description:
      'Free IRS training to become a certified VITA volunteer tax preparer.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/training',
    type: 'website',
  },
};

export default function TrainingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Training" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Volunteer Training</h1>
      <p className="mt-3 text-lg text-black">
        Complete IRS Link & Learn Taxes training to become a certified VITA
        volunteer.
      </p>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">IRS Link & Learn Taxes</h2>
        <p className="text-black mb-6">
          Link & Learn Taxes is the official IRS training program for VITA
          volunteers. It's a free, self-paced online course that teaches you
          everything you need to know to prepare basic tax returns.
        </p>

        <div className="rounded-lg bg-brand-green-50 p-6 mb-6">
          <h3 className="font-semibold text-lg mb-3">Training Includes:</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-brand-green-600 font-bold">•</span>
              <span className="text-black">
                Interactive lessons and videos
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green-600 font-bold">•</span>
              <span className="text-black">
                Practice exercises and quizzes
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green-600 font-bold">•</span>
              <span className="text-black">Real-world tax scenarios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green-600 font-bold">•</span>
              <span className="text-black">
                Certification exam preparation
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-green-600 font-bold">•</span>
              <span className="text-black">
                Reference materials and resources
              </span>
            </li>
          </ul>
        </div>

        <a
          href="https://linklearncertification.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-brand-green-700 transition"
        >
          Open Link & Learn Taxes
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Certification Levels</h2>
        <p className="text-black mb-6">
          Choose the certification level that matches your experience and the
          types of returns you want to prepare.
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border-2 border-brand-green-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Basic Certification</h3>
              <span className="px-3 py-2 rounded-full bg-brand-green-100 text-brand-green-800 text-xs font-semibold">
                RECOMMENDED FOR NEW VOLUNTEERS
              </span>
            </div>
            <p className="text-black mb-3">
              Covers fundamental tax concepts and simple returns (W-2 income,
              standard deduction, basic credits).
            </p>
            <div className="text-sm text-black">
              <strong>Training Time:</strong> 15-20 hours
              <br />
              <strong>Best For:</strong> First-time volunteers, simple returns
            </div>
          </div>

          <div className="rounded-lg border-2 border-brand-blue-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                Intermediate Certification
              </h3>
              <span className="px-3 py-2 rounded-full bg-brand-blue-100 text-brand-blue-800 text-xs font-semibold">
                MOST COMMON
              </span>
            </div>
            <p className="text-black mb-3">
              Includes Basic topics plus itemized deductions, self-employment
              income, and additional credits.
            </p>
            <div className="text-sm text-black">
              <strong>Training Time:</strong> 20-25 hours
              <br />
              <strong>Best For:</strong> Volunteers with some tax knowledge,
              moderate complexity returns
            </div>
          </div>

          <div className="rounded-lg border-2 border-brand-blue-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Advanced Certification</h3>
              <span className="px-3 py-2 rounded-full bg-brand-blue-100 text-brand-blue-800 text-xs font-semibold">
                FOR EXPERIENCED VOLUNTEERS
              </span>
            </div>
            <p className="text-black mb-3">
              Covers all topics including business income, rental property,
              capital gains, and complex situations.
            </p>
            <div className="text-sm text-black">
              <strong>Training Time:</strong> 25-30 hours
              <br />
              <strong>Best For:</strong> Experienced volunteers, quality
              reviewers, complex returns
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Training Timeline</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Register for Training</h3>
              <p className="text-sm text-black mt-1">
                <strong>When:</strong> October - December
                <br />
                <strong>Action:</strong> Contact us to get your Link & Learn
                access code
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Complete Online Training</h3>
              <p className="text-sm text-black mt-1">
                <strong>When:</strong> November - January
                <br />
                <strong>Duration:</strong> 15-30 hours (self-paced)
                <br />
                <strong>Action:</strong> Work through lessons at your own pace
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Pass Certification Exam</h3>
              <p className="text-sm text-black mt-1">
                <strong>When:</strong> December - January
                <br />
                <strong>Passing Score:</strong> 80% or higher
                <br />
                <strong>Action:</strong> Take exam online (can retake if needed)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold">Attend Orientation</h3>
              <p className="text-sm text-black mt-1">
                <strong>When:</strong> January (before tax season)
                <br />
                <strong>Duration:</strong> 2-3 hours
                <br />
                <strong>Action:</strong> Learn site procedures and meet the team
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold">
              5
            </div>
            <div>
              <h3 className="font-semibold">Start Volunteering</h3>
              <p className="text-sm text-black mt-1">
                <strong>When:</strong> Late January - April 15
                <br />
                <strong>Action:</strong> Begin helping taxpayers!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Training Tips</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Study Tips</h3>
            <ul className="space-y-2 text-sm text-black">
              <li>• Set aside 2-3 hours per week for training</li>
              <li>• Take notes on key concepts</li>
              <li>• Complete all practice exercises</li>
              <li>• Review difficult topics multiple times</li>
              <li>• Use the reference materials provided</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Exam Tips</h3>
            <ul className="space-y-2 text-sm text-black">
              <li>• Review all lessons before taking exam</li>
              <li>• Take practice quizzes multiple times</li>
              <li>• Read questions carefully</li>
              <li>• You can retake the exam if needed</li>
              <li>• Keep reference materials handy</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-green-50 border-l-4 border-brand-green-600 p-6">
        <h2 className="text-xl font-bold mb-3">Ready to Start Training?</h2>
        <p className="text-black mb-6">
          Contact us to get your Link & Learn access code and begin your journey
          to becoming a certified VITA volunteer.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-brand-green-700 transition"
          >
            Call support center
          </a>
          <a
            href="mailto:info@elevateforhumanity.org"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-brand-green-50 transition"
          >
            Email for Access Code
          </a>
          <Link
            href="/tax/rise-up-foundation/volunteer"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            Back to Volunteer Info
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6">
        <h3 className="font-semibold text-black">Reference</h3>
        <p className="mt-2 text-sm text-black">
          Official IRS training portal:{' '}
          <a
            href="https://linklearncertification.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            Link & Learn Taxes
          </a>
        </p>
      </section>
    </div>
  );
}
