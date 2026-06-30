import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, Clock } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Application Received | Nail Technician Apprenticeship Partner',
  description: 'Thank you for applying to become a host nail salon for the Indiana Nail Technician Apprenticeship program.',
  robots: { index: false, follow: false },
};

export default function NailThankYouPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Thank You' }]} />
      </div>

      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-purple-600 text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received!</h1>
          <p className="text-lg text-slate-700 mb-8">
            Thank you for applying to become a host nail salon for the Elevate Nail Technician
            Apprenticeship program. Our team will review your application and contact you within
            3 business days.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-bold text-purple-900 mb-4">What Happens Next</h2>
            <ol className="space-y-3">
              {[
                { step: 1, text: 'Our team reviews your application (1–3 business days)' },
                { step: 2, text: 'We schedule a brief onboarding call to verify your salon and discuss the program' },
                { step: 3, text: 'You complete the Worksite MOU and required documents' },
                { step: 4, text: 'We match you with an apprentice candidate' },
                { step: 5, text: 'Training begins — we handle all DOL reporting and IPLA coordination' },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {step}
                  </span>
                  <p className="text-sm text-purple-800">{text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">Review Time</p>
              <p className="text-xs text-slate-500">1–3 business days</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Mail className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">Email</p>
              <a href="mailto:partners@elevateforhumanity.org" className="text-xs text-purple-600 hover:underline">
                partners@elevateforhumanity.org
              </a>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">Phone</p>
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-xs text-purple-600 hover:underline">
                {PLATFORM_DEFAULTS.supportPhone}
              </a>
            </div>
          </div>

          <Link
            href="/partners/nail-technician-apprenticeship"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Program Info <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
