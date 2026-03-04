
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Users, Award, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/create-program' },
  title: 'Create a Training Program | Partners | Elevate For Humanity',
  description: 'Partner with Elevate to create and deliver workforce training programs. ETPL listing, student referrals, and compliance support.',
};

const STEPS = [
  { step: '1', title: 'Submit Program Details', desc: 'Provide your program curriculum, certification outcomes, duration, and cost structure.' },
  { step: '2', title: 'Compliance Review', desc: 'Our team reviews your program for WIOA, ETPL, and state compliance requirements.' },
  { step: '3', title: 'ETPL Listing', desc: 'Approved programs are listed on the Eligible Training Provider List for funded referrals.' },
  { step: '4', title: 'Start Enrolling', desc: 'Receive student referrals from WorkOne offices, community partners, and our enrollment team.' },
];

const BENEFITS = [
  { title: 'Student Referrals', desc: 'Receive funded student referrals from workforce development agencies.', icon: Users },
  { title: 'ETPL Compliance', desc: 'We help you meet and maintain ETPL listing requirements.', icon: FileText },
  { title: 'Credential Tracking', desc: 'Track student certifications and outcomes through our platform.', icon: Award },
  { title: 'Outcome Reporting', desc: 'Automated reporting for completion rates, employment outcomes, and wage data.', icon: BarChart3 },
];

export default function CreateProgramPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Create a Program' }]} />
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/images/pages/partners-pub-page-6.jpg" alt="Create a training program" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Create a Training Program</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Partner with Elevate to deliver workforce training and receive funded student referrals.</p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="space-y-8">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Partner Benefits</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white border border-gray-200 rounded-xl p-6">
                  <Icon className="w-7 h-7 text-brand-blue-600 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to List Your Program?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">Contact our partnerships team to get started.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partners/join" className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg">Partner Application</Link>
            <Link href="/contact" className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
