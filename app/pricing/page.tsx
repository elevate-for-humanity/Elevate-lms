import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { CheckCircle, DollarSign, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: `Pricing | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Most students pay nothing. Learn about funding options, payment plans, and program costs at Elevate for Humanity.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Most students pay nothing. Here's how our pricing works.
          </p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                tag: 'Most Common',
                title: 'Funded Training',
                price: '$0',
                subtitle: 'For eligible students',
                features: ['WIOA coverage', 'Workforce Ready Grant', 'VR funding', 'Job Ready Indy'],
                cta: 'Check Eligibility',
                href: '/check-eligibility',
              },
              {
                tag: 'Flexible',
                title: 'Payment Plan',
                price: 'Varies',
                subtitle: 'Spread costs over time',
                features: ['No interest', 'Monthly payments', 'Set at enrollment', 'No credit check'],
                cta: 'Apply Now',
                href: '/apply',
              },
              {
                tag: 'Quick Programs',
                title: 'Self-Pay',
                price: 'From $500',
                subtitle: 'For non-funded students',
                features: ['Upfront payment', 'Possible discount', 'Ask about financing', 'Payment plans'],
                cta: 'Contact Us',
                href: '/contact',
              },
            ].map((plan) => (
              <div key={plan.title} className={`p-8 rounded-2xl border-2 ${plan.tag === 'Most Common' ? 'border-brand-red-600 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                <span className="inline-block px-3 py-1 bg-brand-red-100 text-brand-red-700 text-xs font-bold rounded-full mb-4">
                  {plan.tag}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                <div className="text-3xl font-bold text-slate-900 mb-1">{plan.price}</div>
                <p className="text-slate-600 text-sm mb-6">{plan.subtitle}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-slate-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block w-full text-center py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Program Costs</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {[
              { program: 'CNA', duration: '6 weeks', cost: 'Funded or $1,500' },
              { program: 'HVAC Technician', duration: '6 weeks', cost: 'Funded or $2,500' },
              { program: 'CDL Class A', duration: '4-8 weeks', cost: 'Funded or $3,500' },
              { program: 'Barber Apprenticeship', duration: '12-18 months', cost: 'Employer-sponsored' },
              { program: 'Medical Assistant', duration: '12 weeks', cost: 'Funded or $3,000' },
              { program: 'IT Help Desk', duration: '12 weeks', cost: 'Funded or $4,000' },
            ].map((row, i) => (
              <div key={row.program} className={`flex items-center justify-between p-4 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                <div>
                  <div className="font-semibold text-slate-900">{row.program}</div>
                  <div className="text-sm text-slate-500">{row.duration}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{row.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-brand-red-600 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Most Students Pay Nothing</h2>
          <p className="text-white/90 mb-8">
            Funding covers tuition, books, and fees for eligible students. Let's find out if you qualify.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/check-eligibility" className="px-8 py-4 bg-white text-brand-red-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
              Check Eligibility — Free
            </Link>
            <Link href="/contact" className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
              Talk to Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
