import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingEligibilityQuiz } from '@/components/eligibility/FundingEligibilityQuiz';

export const metadata: Metadata = {
  title: 'Free Training Eligibility Quiz | Check If You Qualify | Elevate for Humanity',
  description: 'Take our 2-minute quiz to see if you qualify for free workforce training through WIOA, EmployIndy, or other funding programs. No obligation.',
};

export default function EligibilityQuizPage() {
  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Eligibility", href: "/eligibility" }, { label: "Quiz" }]} />
      </div>
{/* Hero */}
      <div className="bg-brand-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Could You Qualify for FREE Training?
          </h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl mx-auto">
            Take this 2-minute quiz to see if you're eligible for government-funded workforce training programs
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              No obligation
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Takes 2 minutes
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Instant results
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              100% confidential
            </span>
          </div>
        </div>
      </div>

      {/* Quiz */}
      <div className="py-12 px-4">
        <FundingEligibilityQuiz />
      </div>

      {/* FAQ */}
      <div className="bg-slate-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Common Questions</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">What is WIOA funding?</summary>
              <p className="mt-3 text-slate-600">
                WIOA (Workforce Innovation and Opportunity Act) is federal funding that pays for job training for eligible adults. 
                If you qualify, your training could be completely free.
              </p>
            </details>
            <details className="bg-white rounded-xl p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">What if I don't qualify for funding?</summary>
              <p className="mt-3 text-slate-600">
                We offer affordable self-pay options and payment plans. Many programs are under $5,000 and can be completed in 8-16 weeks.
              </p>
            </details>
            <details className="bg-white rounded-xl p-6 border border-slate-200">
              <summary className="font-semibold text-slate-900 cursor-pointer">How accurate is this quiz?</summary>
              <p className="mt-3 text-slate-600">
                This quiz gives you a preliminary assessment. Final eligibility is determined by the funding agency after you submit a full application with documentation.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
