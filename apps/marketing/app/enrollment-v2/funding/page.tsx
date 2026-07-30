import Link from 'next/link';
import { ArrowLeft, CheckCircle, DollarSign, CreditCard, Shield, ArrowRight } from 'lucide-react';

const FUNDING_PATHS = [
  {
    icon: DollarSign,
    title: 'WIOA / Workforce Funding',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    desc: 'Workforce Innovation and Opportunity Act funding may cover your full tuition — including books and fees.',
    eligibility: ['Unemployed or underemployed', 'Meet income guidelines', 'Career-connected goal', 'Indiana resident or eligible'],
    benefit: 'Up to 100% tuition coverage',
    benefitColor: 'text-green-700 bg-green-100',
    cta: 'Check WIOA Eligibility',
    ctaColor: 'bg-green-600 hover:bg-green-700',
  },
  {
    icon: CreditCard,
    title: 'BNPL — $0 Deposit',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    desc: 'Spread payments over time with $0 down. Choose Klarna, Affirm, Sezzle, or our payment plan.',
    eligibility: ['Credit or income verification', '18+ years old', 'Valid ID', 'US address'],
    benefit: 'Start with $0 deposit',
    benefitColor: 'text-blue-700 bg-blue-100',
    cta: 'View Payment Plans',
    ctaColor: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    icon: Shield,
    title: 'Employer Sponsorship',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    desc: 'Your employer may cover tuition for career development. We provide all documentation for reimbursement.',
    eligibility: ['Current employment', 'Employer education benefit', 'Program relevant to job role'],
    benefit: 'Employer pays directly',
    benefitColor: 'text-purple-700 bg-purple-100',
    cta: 'Learn About Employer Billing',
    ctaColor: 'bg-purple-600 hover:bg-purple-700',
  },
];

const BUDGET_INSTALLMENTS = [
  { weeks: 12, weekly: '$250–350/wk', note: 'Shortest plan — higher weekly payment' },
  { weeks: 24, weekly: '$130–175/wk', note: 'Most popular — balanced payment' },
  { weeks: 52, weekly: '$60–95/wk', note: 'Lowest payment — longer commitment' },
];

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/enrollment-v2/apply" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-4xl font-bold mb-4">Funding & Payment Options</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Multiple ways to pay. Funding approval can take as little as 24 hours.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Funding Paths */}
        <h2 className="text-2xl font-bold mb-6">Choose Your Path</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {FUNDING_PATHS.map((path) => (
            <div key={path.title} className={`${path.color} border-2 rounded-2xl p-6 flex flex-col`}>
              <div className={`${path.iconBg} ${path.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <path.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{path.title}</h3>
              <p className="text-slate-600 text-sm mb-4 flex-1">{path.desc}</p>

              <div className={`${path.benefitColor} text-sm font-bold px-3 py-1.5 rounded-lg w-fit mb-4`}>
                {path.benefit}
              </div>

              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Eligibility</div>
              <ul className="space-y-1 mb-5">
                {path.eligibility.map(e => (
                  <li key={e} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>

              <Link href="/enrollment-v2/apply" className={`mt-auto w-full text-center text-white font-bold py-3 px-4 rounded-xl transition-colors ${path.ctaColor}`}>
                {path.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* BNPL Calculator */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-2">BNPL Payment Calculator</h2>
          <p className="text-slate-500 mb-8">See your estimated weekly payments based on total program cost.</p>

          <div className="grid md:grid-cols-3 gap-6">
            {BUDGET_INSTALLMENTS.map(plan => (
              <div key={plan.weeks} className="border-2 border-slate-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                <div className="text-3xl font-bold text-blue-600 mb-1">{plan.weeks} weeks</div>
                <div className="text-lg font-bold text-slate-800 mb-1">{plan.weekly}</div>
                <p className="text-sm text-slate-500">{plan.note}</p>
                <Link href="/enrollment-v2/apply" className="mt-4 w-full inline-block text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg transition-colors">
                  Select This Plan
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <p className="text-sm text-slate-500">
              All payments processed securely through Stripe. No hidden fees. Cancel anytime before enrollment starts.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-slate-900 text-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Ready to Enroll?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
              <h3 className="font-bold mb-1">Apply</h3>
              <p className="text-sm text-slate-400">Complete the 5-minute application. Same-day review.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
              <h3 className="font-bold mb-1">Get Approved</h3>
              <p className="text-sm text-slate-400">Paris AI reviews your funding eligibility in 24 hours.</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
              <h3 className="font-bold mb-1">Start Training</h3>
              <p className="text-sm text-slate-400">Sign your agreement and access your student portal immediately.</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/enrollment-v2/apply" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Start Your Application <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
