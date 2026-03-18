import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { XCircle, AlertCircle, ArrowRight, Phone, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Check Eligibility (Before WorkOne) | Elevate for Humanity',
  description: 'Check if you may qualify for free career training through WIOA funding before applying. Final eligibility is determined by WorkOne / Indiana Career Connect.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/check-eligibility',
  },
  openGraph: {
    title: 'Check Eligibility - Free Career Training',
    description: 'See if you may qualify for free workforce training before applying.',
    url: 'https://www.elevateforhumanity.org/check-eligibility',
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
};

export default function CheckEligibilityPage() {
  return (
    <div className="min-h-screen bg-white">            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Check Eligibility" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Check Eligibility (Before WorkOne)
          </h1>
          <p className="text-brand-blue-100 text-lg">
            A quick pre-screen to help you understand if our programs are a good fit
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 px-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-bold text-amber-900 mb-2">Before you apply:</h2>
              <p className="text-amber-800">
                Most Elevate for Humanity programs are funded through state and federal workforce programs.
              </p>
              <p className="text-amber-800 mt-2 font-semibold">
                Final eligibility is determined by WorkOne / Indiana Career Connect (ICC) — not by Elevate for Humanity.
              </p>
              <p className="text-amber-700 mt-2 text-sm">
                The information below is a basic pre-screen to help you understand whether these programs are a good fit before starting the application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* You May Qualify */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-slate-500 flex-shrink-0">•</span>
              You may be a good fit if you:
            </h2>
            <ul className="space-y-4">
              {[
                'Are 18 years or older',
                'Live in Indiana',
                'Are legally authorized to work in the United States',
                'Are unemployed, underemployed, or seeking better-paying work',
                'Are interested in training that leads directly to employment',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-brand-green-50 p-4 rounded-lg">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* You May Not Qualify */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <XCircle className="w-7 h-7 text-brand-red-500" />
              You may not qualify if you:
            </h2>
            <ul className="space-y-4">
              {[
                'Do not live in Indiana',
                'Are not authorized to work in the U.S.',
                'Are already enrolled in another publicly funded training program',
                'Are seeking training for personal enrichment only (not employment)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-brand-red-50 p-4 rounded-lg">
                  <XCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* About Funding */}
          <div className="mb-10 bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-100">
            <h2 className="text-xl font-bold text-brand-blue-900 mb-3">About funding:</h2>
            <p className="text-brand-blue-800 mb-3">
              Training is made possible through workforce funding programs such as WIOA, Workforce Ready Grants, and other state or partner funding sources.
            </p>
            <p className="text-brand-blue-700 text-sm">
              Each funding source has specific requirements. WorkOne / Indiana Career Connect verifies eligibility and documentation as part of the official process.
            </p>
          </div>

          {/* What Happens Next */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Next steps if you apply:</h2>
            <div className="space-y-4">
              {[
                { step: 1, text: 'Submit a short application through Elevate for Humanity' },
                { step: 2, text: 'Complete an eligibility review with WorkOne / Indiana Career Connect' },
                { step: 3, text: 'If approved, you\'ll be placed into the appropriate training pathway' },
                { step: 4, text: 'Begin training and career support' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-gray-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-xl p-8 text-center border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-gray-600 mb-6">
              If the criteria above describe your situation, you may be a good candidate for our programs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/start"
                className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
              >
                Start Eligibility Review
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://www.in.gov/dwd/career-connect/find-a-workone-office/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-white transition"
              >
                <MapPin className="w-5 h-5" />
                Find a WorkOne Location
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-2">Questions about eligibility?</p>
            <a
              href="/support"
              className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:underline"
            >
              <Phone className="w-5 h-5" />
              Call (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
