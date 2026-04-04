import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/wrg',
  },
  title: 'WRG Funded Training | Elevate For Humanity',
  description:
    'Get Funded career training through WRG (Workforce Ready Grant). Indiana residents qualify. No income limits. No age limits.',
};

export default function WrgPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WRG' }]} />
        </div>
      </div>

      {/* Hero Section - Image Only */}
      <section className="relative h-[400px] overflow-hidden">
        <Image
          src="/images/pages/funding-page-6.jpg"
          alt="WRG Success Story"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-base md:text-lg text-black mb-6 leading-relaxed">
            Maria didn't know WRG existed. She was working at Target for
            $14/hour, barely making rent.
          </p>
          <p className="text-lg text-black mb-6">
            She wanted to become a Medical Assistant, but training cost $4,325.
            She couldn't afford it. She looked into student loans, but the
            interest rates were insane. She was stuck.
          </p>
          <p className="text-lg text-black mb-6">
            Then a friend told her about WRG—the Workforce Ready Grant. "It's
            free training," her friend said. "The state of Indiana pays for it."
          </p>
          <p className="text-lg text-black mb-6">
            Maria didn't believe it at first. Free? No catch? But she applied
            anyway. Two weeks later, she was approved. The state paid her entire
            $4,325 tuition. Books included. Certifications included. Everything.
          </p>
          <p className="text-lg text-black mb-6">
            21 days later, Maria graduated as a Certified Medical Assistant. She
            got hired at a clinic making $42,000/year with health insurance.
            "WRG changed my life," she says. "I didn't even know it existed."
          </p>
          <p className="text-lg text-black">
            Most people don't. But now you do.
          </p>
        </div>
      </section>

      {/* What is WRG */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">What is WRG?</h2>

          <p className="text-lg text-black mb-6">
            WRG stands for <strong>Workforce Ready Grant</strong>. It's
            Indiana&apos;s program to help eligible residents access short-term career
            training (4-12 weeks) in high-demand fields at no cost.
          </p>

          <p className="text-lg text-black mb-6">
            For eligible participants, the state covers tuition, books, fees, and certifications.
            No loans. No debt. Funded training that leads to real jobs.
          </p>

          <div className="bg-brand-green-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 text-brand-green-900">
              Who Qualifies?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>Indiana resident</strong> (live in Indiana)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>High school diploma or GED</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>No bachelor's degree or higher</strong> (in most
                  cases)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>Enroll in a WRG-approved program</strong> (we're
                  approved!)
                </span>
              </li>
            </ul>
            <p className="mt-4 text-brand-green-900 font-bold">
              That's it. No income limits. No age limits. No credit check.
            </p>
          </div>
        </div>
      </section>

      {/* What WRG Covers */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            What Does WRG Cover?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Tuition
              </h3>
              <p className="text-black">
                100% of training costs. Whether it's $575 for CPR or $5,000 for
                HVAC, WRG pays for it.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Books & Materials
              </h3>
              <p className="text-black">
                Textbooks, workbooks, study guides—all included.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • Certification Exams
              </h3>
              <p className="text-black">
                State exams, industry certifications, licensing fees—covered.
              </p>
            </div>

            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-3 text-brand-green-900">
                • No Payback Required
              </h3>
              <p className="text-black">
                WRG is a grant, not a loan. You never pay it back. Ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Covered */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Which Programs Are WRG-Approved?
          </h2>

          <p className="text-lg text-black mb-6">
            All of our programs are WRG-approved. Here are the most popular:
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">Medical Assistant</h3>
              <p className="text-black mb-2">
                21 days • $4,325 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Start earning $40K-$45K/year
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">HVAC Technician</h3>
              <p className="text-black mb-2">
                60 days • $5,000 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Start earning $45K-$60K/year
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">CPR Certification</h3>
              <p className="text-black mb-2">
                1 day • $575 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Required for most healthcare jobs
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">
                Professional Esthetician
              </h3>
              <p className="text-black mb-2">
                5 weeks • $4,575 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Start earning $35K-$50K/year
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">Peer Recovery Coach</h3>
              <p className="text-black mb-2">
                45 days • $4,750 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Start earning $35K-$45K/year
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-2">
                Tax Prep & Financial Services
              </h3>
              <p className="text-black mb-2">
                10 weeks • $4,950 (FREE with WRG)
              </p>
              <p className="text-sm text-black">
                Seasonal income + year-round bookkeeping
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/programs"
              className="inline-block px-8 py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 transition-all"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            How to Apply for WRG
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Contact Us</h3>
                <p className="text-black">
                  Call{' '}
                  <a
                    href="/support"
                    className="text-brand-green-600 font-bold"
                  >
                    support center
                  </a>{' '}
                  or fill out our contact form. Tell us which program you're
                  interested in.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  We Check Your Eligibility
                </h3>
                <p className="text-black">
                  We'll verify you're an Indiana resident with a high school
                  diploma/GED. Takes 5 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Apply for WRG</h3>
                <p className="text-black">
                  We help you complete the WRG application online. It's
                  simple—we walk you through every step.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Get Approved</h3>
                <p className="text-black">
                  Most students get approved within 1-2 weeks. The state sends
                  us the payment directly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-base font-bold flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">
                  Start Training (For Free)
                </h3>
                <p className="text-black">
                  Once approved, you start immediately. No tuition bills. No
                  loans. Just training.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Common Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                Can I use WRG if I'm working full-time?
              </h3>
              <p className="text-black">
                Yes! WRG has no income limits. You can be working full-time and
                still qualify. Most of our programs are hybrid (online +
                hands-on), so you can study around your work schedule.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                What if I already have an associate degree?
              </h3>
              <p className="text-black">
                You can still qualify for WRG if your degree is in a different
                field. For example, if you have an associate's in business but
                want to train in healthcare, you're eligible.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                How many times can I use WRG?
              </h3>
              <p className="text-black">
                You can use WRG for multiple programs, as long as you complete
                each one successfully. Many students use it for CPR first, then
                come back for Medical Assistant or HVAC training.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">
                Do I have to pay it back?
              </h3>
              <p className="text-black">
                No. WRG is a grant, not a loan. You never pay it back. Ever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stories */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Real WRG Success Stories
          </h2>

          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>Maria, 34 - Medical Assistant</strong>
              </p>
              <p className="text-black">
                "I was working at Target for $14/hour. I couldn't afford
                training. WRG paid my entire $4,325 tuition. Now I'm a Medical
                Assistant making $42K/year with benefits. WRG changed my life."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>David, 28 - HVAC Technician</strong>
              </p>
              <p className="text-black">
                "I was stuck in retail making $12/hour. WRG paid for my HVAC
                training—$5,000, completely free. 60 days later, I got hired at
                $55K/year. I own a house now. I have savings. WRG gave me a
                future."
              </p>
            </div>

            <div className="bg-white rounded-lg p-6">
              <p className="text-lg text-black mb-4">
                <strong>Tasha, 41 - Professional Esthetician</strong>
              </p>
              <p className="text-black">
                "I always wanted to work in beauty, but I couldn't afford
                esthetician school. WRG paid for everything—$4,575. Now I work
                at a spa making $45K/year plus tips. I love my job. WRG made it
                possible."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Apply for WRG?
          </h2>
          <p className="text-base md:text-lg mb-8">
            Your funded training starts here.
          </p>
          <Link
            href="/contact"
            className="inline-block px-10 py-5 bg-white text-brand-green-600 font-bold rounded-lg hover:bg-white transition-all text-lg shadow-xl"
          >
            Check My Eligibility
          </Link>
          <p className="mt-6 text-black">
            Questions? Call{' '}
            <a href="/support" className="font-bold underline">
              support center
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
