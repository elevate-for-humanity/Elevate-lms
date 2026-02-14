import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Volunteer with VITA - Make a Difference | Rise Up Foundation',
  description:
    'Become an IRS-certified volunteer tax preparer. Help your community while gaining valuable experience. Free training provided.',
  keywords: [
    'VITA volunteer',
    'tax volunteer Indianapolis',
    'IRS volunteer',
    'community service',
    'tax preparer volunteer',
  ],
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/tax/rise-up-foundation/volunteer',
  },
  openGraph: {
    title: 'Volunteer with VITA - Make a Difference',
    description:
      'Become an IRS-certified volunteer tax preparer and help your community.',
    url: 'https://www.elevateforhumanity.org/tax/rise-up-foundation/volunteer',
    type: 'website',
  },
};

export default function VolunteerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Volunteer" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax/rise-up-foundation"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Rise Up Foundation
        </Link>
      </div>

      <h1 className="text-4xl font-bold">Volunteer with VITA</h1>
      <p className="mt-3 text-lg text-black">
        Make a real difference in your community by helping people file their
        taxes for free.
      </p>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Why Volunteer?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">Help Your Community</div>
                <div className="text-sm text-black">
                  Provide free tax help to those who need it most
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">Gain Valuable Skills</div>
                <div className="text-sm text-black">
                  Learn tax preparation and financial literacy
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">IRS Certification</div>
                <div className="text-sm text-black">
                  Receive official IRS training and certification
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">Flexible Schedule</div>
                <div className="text-sm text-black">
                  Choose shifts that work for you
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">Free Training</div>
                <div className="text-sm text-black">
                  All training materials provided at no cost
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-brand-green-600 font-bold text-xl">•</span>
              <div>
                <div className="font-semibold">Resume Builder</div>
                <div className="text-sm text-black">
                  Great experience for accounting/finance careers
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Volunteer Requirements</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Basic Requirements</h3>
            <ul className="list-disc pl-5 space-y-2 text-black">
              <li>Must be 18 years or older</li>
              <li>Pass IRS background check</li>
              <li>Complete IRS Link & Learn Taxes training</li>
              <li>
                Pass certification exam (Basic, Intermediate, or Advanced)
              </li>
              <li>Commit to minimum 4-hour shifts during tax season</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Time Commitment</h3>
            <ul className="list-disc pl-5 space-y-2 text-black">
              <li>
                <strong>Training:</strong> 15-30 hours (self-paced online)
              </li>
              <li>
                <strong>Tax Season:</strong> January - April 15
              </li>
              <li>
                <strong>Shifts:</strong> Minimum 4 hours per shift, flexible
                scheduling
              </li>
              <li>
                <strong>Total:</strong> Most volunteers contribute 40-80 hours
                per season
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">No Experience Needed</h3>
            <p className="text-black">
              You don't need to be a tax expert! We provide comprehensive
              training that covers everything you need to know. Many of our
              volunteers have no prior tax experience and become confident
              preparers after training.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">How to Get Started</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold text-lg">
              1
            </div>
            <div>
              <h3 className="font-semibold text-lg">Express Interest</h3>
              <p className="text-black mt-1">
                Contact us at support center or email to express your interest in
                volunteering.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold text-lg">
              2
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                Complete Background Check
              </h3>
              <p className="text-black mt-1">
                Submit required information for IRS background check (we'll
                guide you through this).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold text-lg">
              3
            </div>
            <div>
              <h3 className="font-semibold text-lg">Complete Training</h3>
              <p className="text-black mt-1">
                Take the IRS Link & Learn Taxes online course at your own pace
                (15-30 hours).
              </p>
              <Link
                href="/tax/rise-up-foundation/training"
                className="text-brand-green-600 hover:underline text-sm mt-1 inline-block"
              >
                View Training Details →
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold text-lg">
              4
            </div>
            <div>
              <h3 className="font-semibold text-lg">Pass Certification Exam</h3>
              <p className="text-black mt-1">
                Take and pass the IRS certification exam (Basic, Intermediate,
                or Advanced level).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center font-bold text-lg">
              5
            </div>
            <div>
              <h3 className="font-semibold text-lg">Start Volunteering</h3>
              <p className="text-black mt-1">
                Choose your shifts and start helping taxpayers in your
                community!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-bold mb-4">Volunteer Roles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="font-semibold text-lg mb-2">Tax Preparer</h3>
            <p className="text-sm text-black">
              Interview taxpayers, prepare returns, and ensure accuracy.
              Requires IRS certification.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="font-semibold text-lg mb-2">Quality Reviewer</h3>
            <p className="text-sm text-black">
              Review completed returns for accuracy before e-filing. Requires
              advanced certification.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="font-semibold text-lg mb-2">Greeter/Intake</h3>
            <p className="text-sm text-black">
              Welcome taxpayers, check documents, and complete intake forms. No
              certification required.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="font-semibold text-lg mb-2">Site Coordinator</h3>
            <p className="text-sm text-black">
              Manage volunteer schedules, supplies, and site operations.
              Leadership experience helpful.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-green-50 border-l-4 border-brand-green-600 p-6">
        <h2 className="text-xl font-bold mb-3">Ready to Make a Difference?</h2>
        <p className="text-black mb-6">
          Join our team of dedicated volunteers and help your community this tax
          season.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/support"
            className="px-6 py-3 rounded-lg bg-brand-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            Call support center
          </a>
          <a
            href="mailto:elevate4humanityedu@gmail.com"
            className="px-6 py-3 rounded-lg border-2 border-brand-green-600 text-brand-green-600 font-semibold hover:bg-green-50 transition"
          >
            Email Us
          </a>
          <Link
            href="/tax/rise-up-foundation/training"
            className="px-6 py-3 rounded-lg border font-semibold hover:bg-gray-50 transition"
          >
            View Training Info
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6">
        <h3 className="font-semibold text-black">Reference</h3>
        <p className="mt-2 text-sm text-black">
          For more information about volunteering with VITA, visit the{' '}
          <a
            href="https://www.irs.gov/individuals/irs-tax-volunteers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            IRS Tax Volunteers page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
