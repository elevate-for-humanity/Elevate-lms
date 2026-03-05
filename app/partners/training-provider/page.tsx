
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Shield, Users, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/training-provider' },
  title: 'Training Provider Partnership | Elevate For Humanity',
  description: 'Become an approved training provider on the Elevate platform. Access funded student referrals, compliance tools, and outcome tracking.',
};

const REQUIREMENTS = [
  'Licensed or industry-recognized training provider in good standing',
  'Programs that lead to industry-recognized certifications or credentials',
  'Demonstrated employment outcomes for program graduates',
  'Willingness to meet WIOA and ETPL reporting requirements',
  'Capacity to serve WIOA-eligible and funded students',
];

export default function TrainingProviderPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Training Provider' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/images/pages/partners-pub-page-8.jpg" alt="Training provider partnership" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Training Provider Partnership</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Join our network of approved training providers and receive funded student referrals.</p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Provider Requirements</h2>
          <ul className="space-y-4">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What You Get</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Funded Referrals', desc: 'Receive WIOA and state-funded student referrals.', icon: Users },
              { title: 'ETPL Support', desc: 'Help with ETPL application and maintenance.', icon: Shield },
              { title: 'Platform Access', desc: 'LMS, student tracking, and credential management.', icon: Building2 },
              { title: 'Outcome Reporting', desc: 'Automated compliance and outcome reports.', icon: BarChart3 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
                  <Icon className="w-7 h-7 text-brand-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Become an Approved Provider</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Apply to join our training provider network.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partners/join" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Apply Now</Link>
            <Link href="/contact" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
