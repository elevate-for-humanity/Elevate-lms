import Link from 'next/link';

interface PathwayDisclosureProps {
  programName?: string;
  programSlug?: string;
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Pathway Disclosure Component
 * 
 * Displays the structured career pathway information required for ETPL/WRG compliance.
 * Must be shown above the primary CTA on every program page and on the homepage.
 * 
 * Pathway Order:
 * 1. Eligibility & Career Alignment (Stage 1)
 * 2. Training & On-the-Job Learning (Stage 2)  
 * 3. Internship & Job Placement (Stage 3)
 */
export default function PathwayDisclosure({ 
  programName,
  programSlug,
  variant = 'full',
  className = ''
}: PathwayDisclosureProps) {
  const applyUrl = programSlug ? `/apply?pathway=${programSlug}` : '/apply';
  
  if (variant === 'compact') {
    return (
      <div className={`bg-brand-blue-50 border border-brand-blue-100 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700 mb-3">
              <strong>How it works:</strong> All training is delivered through our structured pathway. 
              Start with eligibility verification, then enter training with on-the-job learning, 
              followed by employer placement support.
            </p>
            <Link 
              href={applyUrl}
              className="inline-flex items-center justify-center bg-brand-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-brand-blue-700 transition-colors text-sm"
            >
              Start Eligibility & Choose a Career Path
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={`py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 text-center">
          {programName ? `${programName} Career Pathway` : 'Our Structured Career Pathway'}
        </h2>
        
        {/* 3-Stage Visual */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Stage 1 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center font-bold text-sm mb-3">1</div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Eligibility & Career Alignment</h3>
            <p className="text-xs text-slate-600">
              Determine funding eligibility and select your career pathway.
            </p>
          </div>
          
          {/* Stage 2 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 bg-brand-green-100 text-brand-green-600 rounded-full flex items-center justify-center font-bold text-sm mb-3">2</div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Training & OJT</h3>
            <p className="text-xs text-slate-600">
              Complete occupational training with structured on-the-job learning.
            </p>
          </div>
          
          {/* Stage 3 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-sm mb-3">3</div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Internship & Placement</h3>
            <p className="text-xs text-slate-600">
              Employer-hosted placement to support employment transition.
            </p>
          </div>
        </div>
        
        {/* Disclosure Text */}
        <div className="bg-brand-blue-50 border border-brand-blue-100 rounded-lg p-4 text-xs text-slate-600 mb-5">
          <p>
            Elevate for Humanity delivers all training through a structured career pathway. 
            Participants begin with an eligibility and career alignment phase, where funding eligibility is determined and program selection occurs. 
            Once eligibility is confirmed, participants enter occupational training with structured on-the-job learning. 
            Training is followed by an employer-hosted internship or work-based placement. 
            Program enrollment, training, and placement are contingent upon eligibility, funding availability, and employer participation.
          </p>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <Link 
            href={applyUrl}
            className="inline-flex items-center justify-center bg-brand-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-blue-700 transition-colors"
          >
            Start Eligibility & Choose a Career Path
          </Link>
        </div>
      </div>
    </section>
  );
}
