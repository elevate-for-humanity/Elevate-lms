import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

interface PageFlowProps {
  currentStep?: 'learn' | 'apply' | 'enroll' | 'train' | 'work';
  nextStepHref?: string;
  nextStepLabel?: string;
}

export function PageFlow({ currentStep = 'learn', nextStepHref = '/apply', nextStepLabel = 'Apply Now' }: PageFlowProps) {
  const steps = [
    { id: 'learn', label: 'Learn About Programs', active: currentStep === 'learn' },
    { id: 'apply', label: 'Submit Application', active: currentStep === 'apply' },
    { id: 'enroll', label: 'Get Approved & Enroll', active: currentStep === 'enroll' },
    { id: 'train', label: 'Complete Training', active: currentStep === 'train' },
    { id: 'work', label: 'Start Your Career', active: currentStep === 'work' },
  ];

  return (
    <div className="bg-slate-50 border-y py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-black mb-4 text-center">YOUR JOURNEY</h3>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step.active
                        ? 'bg-brand-orange-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`mt-2 text-xs text-center font-medium ${
                      step.active ? 'text-brand-orange-600' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-slate-300 mx-2 mt-[-24px]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Next Step CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={nextStepHref}
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold rounded-lg transition"
          >
            {nextStepLabel}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-black font-bold rounded-lg border-2 border-slate-300 transition"
          >
            <Phone className="w-5 h-5" />
            Talk to an Advisor
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-6 text-center text-sm text-black">
          <span>Not sure if you qualify? </span>
          <Link href="/funding" aria-label="Link" className="text-brand-orange-600 hover:underline font-semibold">
            Check Eligibility
          </Link>
          <span className="mx-2">•</span>
          <Link href="/how-it-works" aria-label="Link" className="text-brand-orange-600 hover:underline font-semibold">
            How It Works
          </Link>
          <span className="mx-2">•</span>
          <Link href="/faq" aria-label="Link" className="text-brand-orange-600 hover:underline font-semibold">
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

// Compliance Footer Component
export function ComplianceFooter() {
  return (
    <div className="bg-slate-100 border-t py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-xs text-black space-y-2">
          <p>
            <strong>Equal Opportunity:</strong> Elevate for Humanity is an equal opportunity employer and training provider.
            We do not discriminate on the basis of race, color, religion, sex, national origin, age, disability, or any other protected class.
          </p>
          <p>
            <strong>FERPA Compliance:</strong> Student records are protected under the Family Educational Rights and Privacy Act (FERPA).
            We maintain strict confidentiality of all student information.
          </p>
          <p>
            <strong>Funding Disclaimer:</strong> Program availability and funding eligibility are subject to change.
            WIOA, WRG, and JRI funding require meeting specific eligibility criteria. Contact us to verify your eligibility.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/privacy-policy" aria-label="Link" className="hover:text-brand-orange-600">Privacy Policy</Link>
            <Link href="/terms-of-service" aria-label="Link" className="hover:text-brand-orange-600">Terms of Service</Link>
            <Link href="/accessibility" aria-label="Link" className="hover:text-brand-orange-600">Accessibility</Link>
            <Link href="/ferpa" aria-label="Link" className="hover:text-brand-orange-600">FERPA Notice</Link>
            <Link href="/equal-opportunity" aria-label="Link" className="hover:text-brand-orange-600">Equal Opportunity</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
