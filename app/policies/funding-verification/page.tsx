export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Phone, Mail, Shield, AlertCircle } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Funding Verification Policy | Elevate for Humanity',
  description: 'Funding verification requirements for enrollment. Accepted funding sources, verification process, and required documentation.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies/funding-verification' },
};

const fundingSources = [
  { title: 'WIOA Voucher', description: 'Workforce Innovation and Opportunity Act Individual Training Account (ITA) voucher from your local WorkOne office.' },
  { title: 'Workforce Ready Grant', description: 'Indiana state grant covering up to $7,500/year for eligible certificate programs.' },
  { title: 'JRI Funding', description: 'Justice Reinvestment Initiative funding for justice-involved individuals.' },
  { title: 'SNAP E&T', description: 'Supplemental Nutrition Assistance Program Employment & Training funding.' },
  { title: 'Employer Sponsorship', description: 'Employer-paid tuition with a signed sponsorship agreement.' },
  { title: 'Self-Pay', description: 'Direct payment via credit card, payment plan, or bank transfer.' },
];

export default async function FundingVerificationPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('policies').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Funding Verification' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-slate-300" />
            <span className="text-slate-300 text-sm uppercase tracking-wider font-medium">Policy</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Funding Verification Policy</h1>
          <p className="text-xl text-slate-300">Requirements and process for verifying enrollment funding</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2024</p>

          <div className="prose prose-lg max-w-none">
            <h2>Overview</h2>
            <p>
              All students must verify their funding source before enrollment can be finalized. This policy
              ensures that tuition and fees are covered and that students can focus on their training without
              financial uncertainty. Verification typically takes 2-3 business days.
            </p>
          </div>

          {/* Funding Sources */}
          <div className="my-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Accepted Funding Sources</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {fundingSources.map((source, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-5 border">
                  <div className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{source.title}</h3>
                      <p className="text-gray-600 text-sm">{source.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Verification Process</h2>
          </div>

          <div className="my-8 space-y-4">
            {[
              { step: '1', title: 'Submit Funding Documentation', desc: 'Upload your funding authorization letter, voucher, or payment information through the enrollment portal or email.' },
              { step: '2', title: 'Financial Aid Review', desc: 'Our financial aid team reviews your documentation and contacts the funding source for confirmation (2-3 business days).' },
              { step: '3', title: 'Approval Notification', desc: 'You will receive an email confirming your funding has been verified and your enrollment is approved.' },
              { step: '4', title: 'Enrollment Confirmation', desc: 'Once funding is verified, you will receive your enrollment agreement and program start date.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-5 border">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Required Documentation</h2>
            <ul>
              <li><strong>WIOA:</strong> ITA voucher or authorization letter from WorkOne</li>
              <li><strong>WRG:</strong> FAFSA confirmation and WRG award letter</li>
              <li><strong>JRI:</strong> Referral letter from probation/parole officer</li>
              <li><strong>SNAP E&T:</strong> SNAP E&T referral from FSSA or case manager</li>
              <li><strong>Employer:</strong> Signed employer sponsorship agreement</li>
              <li><strong>Self-Pay:</strong> Signed enrollment agreement and payment method on file</li>
            </ul>

            <h2>Important Notes</h2>
          </div>

          <div className="my-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <ul className="space-y-2 text-gray-700">
                  <li>Enrollment is not finalized until funding verification is complete.</li>
                  <li>Students may not begin training until funding is confirmed.</li>
                  <li>If funding is denied, students will be notified and offered alternative funding options.</li>
                  <li>Self-pay students must sign an enrollment agreement and provide payment before starting.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-slate-50 rounded-xl p-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help With Funding?</h2>
            <p className="text-gray-600 mb-6">Our financial aid team can help you identify funding options and complete the verification process.</p>
            <div className="flex flex-wrap gap-4">
              <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition">
                <Mail className="w-4 h-4" /> Email Us
              </a>
              <a href="/support" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
                <Phone className="w-4 h-4" /> Get Help Online
              </a>
              <Link href="/check-eligibility" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700 transition">
                Register at Indiana Career Connect <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
