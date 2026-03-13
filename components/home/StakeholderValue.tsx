import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Link from 'next/link';
import { GraduationCap, Building2, Landmark, ArrowRight, CheckCircle } from 'lucide-react';

const STAKEHOLDERS = [
  {
    icon: GraduationCap,
    audience: 'For Job Seekers',
    headline: 'Zero cost. Real credential. Employer pipeline.',
    benefits: [
      'No upfront tuition — WIOA, WRG, and JRI cover everything',
      'Industry-recognized credentials in 6–16 weeks',
      'Direct employer connections — not job boards',
      'Career coaching, resume support, interview prep',
    ],
    cta: 'Check Eligibility',
    href: '/wioa-eligibility',
    gradient: 'bg-brand-blue-600',
    bg: 'bg-brand-blue-50',
    border: 'border-brand-blue-200',
  },
  {
    icon: Building2,
    audience: 'For Employers',
    headline: 'Pre-screened talent. Tax credits. Reduced cost-per-hire.',
    benefits: [
      'Candidates screened, tested, and credentialed before referral',
      'Up to $9,600 WOTC tax credit per eligible hire',
      '75% OJT wage reimbursement during training period',
      'Registered Apprenticeship setup and compliance support',
    ],
    cta: 'Access Talent Pipeline',
    href: '/employer',
    gradient: 'bg-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    icon: Landmark,
    audience: 'For Workforce Agencies',
    headline: 'Measurable outcomes. Fund utilization tracking. Audit-ready.',
    benefits: [
      'Real-time enrollment, completion, and employment tracking',
      'WIOA performance indicator alignment',
      'Exportable compliance reports for federal/state audits',
      'Multi-region partner portal with scoped access',
    ],
    cta: 'Partnership Inquiry',
    href: '/contact',
    gradient: 'bg-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
];

export default function StakeholderValue() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Clear Value for Every Stakeholder
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              What&apos;s in it for you — specifically.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-8">
          {STAKEHOLDERS.map((s, i) => {
            const Icon = s.icon;
            return (
              <ScrollReveal key={i} delay={i * 120}>
                <div className={`${s.bg} border ${s.border} rounded-2xl p-8 h-full flex flex-col hover:shadow-lg transition-shadow`}>
                  <div className={`w-12 h-12 rounded-xl ${s.gradient} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {s.audience}
                  </p>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-5">
                    {s.headline}
                  </h3>
                  <ul className="space-y-3 mb-8 flex-1">
                    {s.benefits.map((b, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 font-bold text-slate-900 hover:gap-3 transition-all"
                  >
                    {s.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
