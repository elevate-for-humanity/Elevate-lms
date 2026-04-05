import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inquiry Received | Elevate for Humanity',
};

export default function InquiryReceivedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 text-center">

        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          We received your inquiry!
        </h1>
        <p className="text-black mb-2 leading-relaxed">
          Thank you for your interest in Elevate for Humanity. An advisor will
          follow up with you within <strong>1–2 business days</strong> with program
          details, costs, and next steps.
        </p>
        <p className="text-black text-sm mb-8">
          Check your email for a confirmation. Questions? Call us at{' '}
          <a href="tel:+13173143757" className="text-brand-blue-600 font-semibold">(317) 314-3757</a>{' '}
          or email{' '}
          <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600">
            info@elevateforhumanity.org
          </a>.
        </p>

        {/* Indiana funding callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left mb-8">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            Indiana residents — funding may cover your tuition
          </p>
          <p className="text-sm text-amber-700 leading-relaxed mb-3">
            While you wait to hear from us, you can start exploring funding options.
            WIOA, WorkOne, EmployIndy, and the Workforce Ready Grant may cover
            your full tuition cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg transition-colors">
              Find WorkOne Office →
            </a>
            <a href="https://www.employindy.org" target="_blank" rel="noopener noreferrer"
               className="flex-1 text-center text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg transition-colors">
              EmployIndy (Marion Co.) →
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/apply/student"
            className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors">
            Ready to Enroll Instead?
          </Link>
          <Link href="/"
            className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-lg text-sm transition-colors">
            Return to Homepage
          </Link>
        </div>

      </div>
    </div>
  );
}
