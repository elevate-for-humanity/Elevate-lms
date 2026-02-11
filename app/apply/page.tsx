import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { MessageSquare, GraduationCap, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';
import { resolveProgram } from '@/lib/program-registry';

export const metadata: Metadata = {
  title: 'Apply | Elevate for Humanity',
  description: 'Start your journey to a new career. Choose to get more information or enroll directly in our free workforce training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; pathway?: string }>;
}) {
  const params = await searchParams;
  const rawProgram = (params?.program || params?.pathway || '').trim();

  // If a program slug (or alias) is provided, resolve it and redirect to the correct intake form
  if (rawProgram) {
    const entry = resolveProgram(rawProgram);
    if (entry) {
      // Programs with dedicated enrollment pages (e.g., barber with payment integration)
      if (entry.dedicatedApplyPage) {
        redirect(entry.dedicatedApplyPage);
      }
      const dest = entry.formType === 'apply'
        ? `/apply/student?program=${entry.slug}`
        : `/inquiry?program=${entry.slug}`;
      redirect(dest);
    }
    // Unknown slug — fall through to the generic page
  }
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply' }]} />
        </div>
      </div>

      {/* Hero */}
      <section 
        className="relative py-12 sm:py-16 md:py-20 px-4"
        style={{ 
          backgroundImage: 'url(/hero-images/apply-hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Let's Match You to the Fastest Enrollment Path
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-2">
            We'll ask a few quick questions to route you to funded options if you qualify, or self-pay if you don't.
          </p>
          <p className="text-sm sm:text-base text-blue-200">
            Answer honestly—this doesn't lock you in. It just routes you to the fastest approval path.
          </p>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/apply-section-video.mp4" 
        title="Start Your Journey" 
      />

      {/* Eligibility Notice */}
      <section className="py-6 px-4 bg-amber-50 border-b border-amber-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-medium">
                Eligibility approval through WorkOne / Indiana Career Connect is required before enrollment.
              </p>
              <Link 
                href="/check-eligibility" 
                className="text-amber-700 text-sm hover:underline mt-1 inline-block"
              >
                Check eligibility before applying →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Options */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-4">
            Choose Your Enrollment Path
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Your answers help route you to funded options if you qualify. We'll match you with funded training (WIOA/WRG/JRI or partner funding), or self-pay / employer-pay.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Inquiry Option */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-blue-500 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Get More Information</h3>
              <p className="text-slate-600 mb-6">
                Not sure which program is right for you? Submit an inquiry and our enrollment team will contact you to discuss your options.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Quick 2-minute form</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Get personalized program recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Learn about funding options</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Response within 1-2 business days</span>
                </li>
              </ul>

              <Link
                href="/inquiry"
                className="block w-full text-center py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Submit an Inquiry
              </Link>
            </div>

            {/* Enroll Option */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Enroll Now</h3>
              <p className="text-slate-600 mb-6">
                Ready to start? Choose your program and begin the enrollment process. Our team will guide you through funding eligibility.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Browse all available programs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">See program details and schedules</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Start enrollment immediately</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">Most programs are FREE with WIOA</span>
                </li>
              </ul>

              <Link
                href="/programs"
                className="block w-full text-center py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                View Programs & Apply
              </Link>
              <p className="text-xs text-slate-500 mt-3 text-center">
                A workforce advisor will confirm your eligibility and start date after you apply.
              </p>
            </div>
          </div>

          {/* Enrollment Process Explanation */}
          <div className="mt-12 bg-slate-100 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-center">What Happens After You Apply</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <p className="text-sm font-medium text-slate-900">Application Review</p>
                <p className="text-xs text-slate-500">1-2 business days</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <p className="text-sm font-medium text-slate-900">Eligibility Check</p>
                <p className="text-xs text-slate-500">WorkOne verification</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <p className="text-sm font-medium text-slate-900">Funding Confirmed</p>
                <p className="text-xs text-slate-500">WIOA/WRG approval</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <p className="text-sm font-medium text-slate-900">Start Date Assigned</p>
                <p className="text-xs text-slate-500">Based on cohort availability</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Application FAQ</h2>
          <div className="space-y-4">
            {[
              { q: 'How long does the application take?', a: 'The initial application takes about 5-10 minutes. After submission, our team reviews it within 1-2 business days.' },
              { q: 'Do I need to pay anything to apply?', a: 'No. The application is free. If you qualify for WIOA or other funding, training is also free. Self-pay options are available for those who don\'t qualify.' },
              { q: 'What documents do I need?', a: 'For the initial application, just basic contact info. For funding verification, you may need ID, proof of income, and proof of address. We\'ll guide you through it.' },
              { q: 'How soon can I start training?', a: 'Most people start within 2-4 weeks of completing the eligibility process. Some programs have set start dates based on cohorts.' },
              { q: 'What if I don\'t qualify for free training?', a: 'We offer self-pay and payment plan options. Some programs also have employer-sponsored spots. We\'ll discuss all options with you.' },
              { q: 'Can I apply for multiple programs?', a: 'Yes, you can express interest in multiple programs. Our team will help you choose the best fit based on your goals and eligibility.' },
            ].map((faq, i) => (
              <details key={i} className="bg-slate-50 rounded-xl overflow-hidden group">
                <summary className="p-5 cursor-pointer font-semibold text-slate-900 flex justify-between items-center">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5 text-slate-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 px-4 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Prefer to Talk to Someone?
          </h2>
          <p className="text-slate-600 mb-6">
            Our enrollment team is available Monday-Friday, 9am-5pm EST
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-900">(317) 314-3757</span>
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="font-semibold text-slate-900">Contact Us Online</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
