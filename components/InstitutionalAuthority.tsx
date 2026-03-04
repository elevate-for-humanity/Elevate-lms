import Image from 'next/image';
import { GraduationCap, Award, FileCheck, Briefcase, Building2 } from 'lucide-react';

const AUTHORITIES = [
  {
    title: 'DOL Registered Apprenticeship Sponsor',
    abbr: 'USDOL',
    desc: 'Registered with the U.S. Department of Labor. Apprenticeships tracked in the RAPIDS system.',
    image: '/images/partners/usdol.webp',
    color: 'text-brand-blue-700',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
  },
  {
    title: 'ETPL Approved Training Provider',
    abbr: 'ETPL',
    desc: 'Listed on Indiana\'s Eligible Training Provider List. Programs qualify for WIOA and Workforce Ready Grant funding.',
    image: '/images/partners/dwd.webp',
    color: 'text-brand-red-700',
    bg: 'bg-brand-red-50',
    border: 'border-brand-red-200',
  },
  {
    title: 'Authorized Testing Center',
    abbr: 'Certiport',
    desc: 'Certiport Authorized Testing Center for industry certification exams.',
    image: '/images/partners/microsoft-logo.png',
    color: 'text-brand-blue-700',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
  },
  {
    title: 'EPA 608 Certification',
    abbr: 'EPA 608',
    desc: 'EPA Section 608 Universal Certification prep and exam — required for HVAC refrigerant handling.',
    image: '/images/pages/comp-cta-training.jpg',
    color: 'text-brand-green-700',
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
  },
  {
    title: 'OSHA Safety Training',
    abbr: 'OSHA',
    desc: 'OSHA 10 and OSHA 30 construction safety certification through authorized outreach trainers.',
    image: '/images/partners/osha.webp',
    color: 'text-brand-orange-700',
    bg: 'bg-brand-orange-50',
    border: 'border-brand-orange-200',
  },
  {
    title: 'Employer Pipeline',
    abbr: 'OJT',
    desc: 'Direct employer partnerships with work-based learning, externships, and apprenticeship pathways.',
    image: '/images/partners/workone.webp',
    color: 'text-brand-blue-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
];

/**
 * Full authority banner — used on homepage and about page.
 * Shows all 6 institutional credentials in a grid.
 */
export function AuthorityBanner() {
  return (
    <section className="py-12 md:py-16 bg-white border-t border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-widest mb-2">Institutional Authority</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Authorized. Registered. Certified.</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
            Elevate for Humanity is a DOL-registered apprenticeship sponsor, ETPL-approved training provider,
            and authorized testing center — not a content vendor.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {AUTHORITIES.map((a) => (
            <div key={a.abbr} className={`${a.bg} border ${a.border} rounded-xl p-4 text-center`}>
              <div className="w-14 h-14 rounded-lg bg-white border border-gray-100 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                <Image src={a.image} alt={a.abbr} width={48} height={48} className="object-contain w-10 h-10" />
              </div>
              <div className={`text-xs font-bold ${a.color} mb-1`}>{a.abbr}</div>
              <div className="text-[11px] font-semibold text-gray-900 leading-tight">{a.title}</div>
              <div className="text-[10px] text-gray-500 mt-1 leading-snug">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Compact authority strip — used in footer and program pages.
 * Single row of badge pills.
 */
export function AuthorityStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {AUTHORITIES.slice(0, 5).map((a) => (
        <span key={a.abbr} className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full ${a.bg} ${a.color} border ${a.border}`}>
          <Image src={a.image} alt={a.abbr} width={12} height={12} className="w-3 h-3 object-contain" />
          {a.abbr}
        </span>
      ))}
    </div>
  );
}

/**
 * Credential pipeline section — shows the formal issuance flow.
 * Used on program detail pages.
 */
export function CredentialPipeline() {
  const steps = [
    { step: '1', label: 'Enroll', desc: 'Apply and enroll through Elevate LMS', icon: GraduationCap },
    { step: '2', label: 'Train', desc: 'Complete RTI coursework and hands-on labs', icon: Building2 },
    { step: '3', label: 'Certify', desc: 'Pass industry certification exams', icon: Award },
    { step: '4', label: 'Credential', desc: 'Receive verifiable digital credential', icon: FileCheck },
    { step: '5', label: 'Employ', desc: 'Job placement with employer partners', icon: Briefcase },
  ];

  return (
    <section className="py-10 bg-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-xs font-semibold text-brand-red-600 uppercase tracking-widest mb-2 text-center">Credential Pipeline</p>
        <h3 className="text-xl font-bold text-gray-900 text-center mb-8">From Enrollment to Employment</h3>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          {steps.map((s, i) => (
            <div key={s.step} className="flex items-center gap-3 md:flex-col md:text-center md:gap-2 flex-1">
              <div className="w-10 h-10 rounded-full bg-brand-red-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {s.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{s.label}</div>
                <div className="text-[11px] text-gray-500">{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block w-full h-0.5 bg-brand-red-200 mt-5 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export { AUTHORITIES };
