import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DollarSign, CheckCircle, FileText, ArrowRight, Users, Clock, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'WOTC — Work Opportunity Tax Credit | Elevate for Humanity',
  description: 'Learn how employers can earn $2,400–$9,600 per eligible hire through the Work Opportunity Tax Credit (WOTC) program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer-portal/wotc' },
};

const targetGroups = [
  { group: 'WIOA/TANF Recipients', credit: 'Up to $2,400', description: 'Individuals receiving Temporary Assistance for Needy Families' },
  { group: 'Veterans (SNAP recipients)', credit: 'Up to $2,400', description: 'Veterans who received SNAP benefits in the past 15 months' },
  { group: 'Disabled Veterans', credit: 'Up to $9,600', description: 'Veterans with service-connected disabilities' },
  { group: 'Ex-Felons', credit: 'Up to $2,400', description: 'Individuals convicted of a felony and hired within 1 year of release' },
  { group: 'Vocational Rehabilitation Referrals', credit: 'Up to $2,400', description: 'Individuals referred by a state vocational rehabilitation agency' },
  { group: 'Summer Youth Employees', credit: 'Up to $1,200', description: 'Youth ages 16–17 in empowerment zones during summer months' },
  { group: 'SNAP Recipients (ages 18–39)', credit: 'Up to $2,400', description: 'Young adults receiving Supplemental Nutrition Assistance' },
  { group: 'SSI Recipients', credit: 'Up to $2,400', description: 'Individuals receiving Supplemental Security Income' },
  { group: 'Long-Term Unemployment Recipients', credit: 'Up to $5,600', description: 'Individuals unemployed for 27+ consecutive weeks' },
];

const steps = [
  { title: 'Screen Candidates', description: 'Use IRS Form 8850 to pre-screen new hires before or on the day employment begins.' },
  { title: 'Submit to SWA', description: 'Submit Form 8850 to your State Workforce Agency within 28 days of the hire start date.' },
  { title: 'Receive Certification', description: 'The SWA verifies eligibility and issues a certification letter.' },
  { title: 'Claim the Credit', description: 'File IRS Form 5884 with your tax return to claim the credit.' },
];

export default function WOTCPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Employer Portal', href: '/employer-portal' },
            { label: 'WOTC' },
          ]} />
        </div>
      </div>

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-brand-green-400" />
          <h1 className="text-4xl font-bold mb-4">Work Opportunity Tax Credit</h1>
          <p className="text-xl text-slate-300">
            Earn $2,400–$9,600 per eligible hire while building your workforce.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What is WOTC?</h2>
          <p className="text-slate-600 mb-4">
            The Work Opportunity Tax Credit (WOTC) is a federal tax credit available to employers
            who hire individuals from certain target groups that face barriers to employment.
            The credit is calculated as a percentage of first-year wages paid to qualifying employees.
          </p>
          <p className="text-slate-600">
            Many Elevate for Humanity graduates qualify under one or more WOTC target groups.
            When you hire our graduates, you may be eligible for tax credits while gaining
            skilled, trained workers.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Eligible Target Groups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targetGroups.map((tg) => (
              <div key={tg.group} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{tg.group}</h3>
                  <span className="text-brand-green-600 font-bold text-sm whitespace-nowrap ml-2">{tg.credit}</span>
                </div>
                <p className="text-xs text-slate-500">{tg.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How to Claim WOTC</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Key Requirements</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'IRS Form 8850 must be submitted within 28 days of hire start date',
              'Employee must work at least 120 hours for a 25% credit (400 hours for 40%)',
              'Credit applies to first-year wages only (up to $6,000–$24,000 depending on group)',
              'Cannot claim WOTC for rehired employees or relatives',
              'Tax-exempt organizations can claim WOTC against payroll taxes for qualified veterans',
              'Credits can be carried back 1 year or forward 20 years',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{req}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Required Forms</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { form: 'IRS Form 8850', desc: 'Pre-Screening Notice and Certification Request' },
              { form: 'ETA Form 9061', desc: 'Individual Characteristics Form (employer completes)' },
              { form: 'IRS Form 5884', desc: 'Work Opportunity Credit (filed with tax return)' },
            ].map((f) => (
              <div key={f.form} className="flex items-start gap-3 p-4 border rounded-lg">
                <FileText className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{f.form}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-900 text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Hire Elevate Graduates &amp; Earn Tax Credits</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Our workforce development programs train candidates who may qualify for WOTC.
            We can help you identify eligible hires and navigate the certification process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer-portal"
              className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition"
            >
              Employer Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:3172968560"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition"
            >
              <Phone className="w-4 h-4" /> (317) 296-8560
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
