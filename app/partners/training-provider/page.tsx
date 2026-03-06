
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

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

const BENEFITS = [
  {
    title: 'Funded Student Referrals',
    desc: 'Receive WIOA ITA-funded and state-funded student referrals directly from WorkOne and our enrollment team. No marketing cost to you.',
    image: '/images/pages/training-providers-page-1.jpg',
  },
  {
    title: 'ETPL Application Support',
    desc: 'We help you navigate the Indiana DWD Eligible Training Provider List application and annual renewal process.',
    image: '/images/pages/training-page-1.jpg',
  },
  {
    title: 'LMS & Student Tracking',
    desc: 'Access our platform for enrollment management, attendance tracking, credential issuance, and compliance reporting.',
    image: '/images/pages/training-classroom.jpg',
  },
  {
    title: 'Automated Outcome Reports',
    desc: 'Credential attainment, job placement, and wage data reported automatically to meet WIOA performance requirements.',
    image: '/images/pages/certifications-page-1.jpg',
  },
];

export default function TrainingProviderPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: 'Training Provider' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
        <Image src="/images/pages/training-providers-page-1.jpg" alt="Training provider partnership with Elevate for Humanity" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Title */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Training Provider Partnership</h1>
          <p className="text-lg text-slate-300 max-w-3xl">
            Join our network of approved training providers. We connect you with WIOA-funded students, handle compliance reporting, and support your ETPL listing.
          </p>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">What You Get</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {BENEFITS.map((item) => (
              <div key={item.title} className="flex gap-5 items-start border border-slate-200 rounded-xl overflow-hidden">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image src={item.image} alt={item.title} fill sizes="128px" className="object-cover" />
                </div>
                <div className="py-4 pr-4">
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Provider Requirements</h2>
              <ul className="space-y-4">
                {REQUIREMENTS.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-slate-700 text-sm">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
              <Image src="/images/pages/platform-partners-hero.jpg" alt="Training provider requirements" fill sizes="50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">How the Partnership Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Apply', desc: 'Submit your provider application. We review your programs, credentials, and outcomes.', image: '/images/pages/partners-pub-page-1.jpg' },
              { step: '2', title: 'Get Listed', desc: 'We help you get on the Indiana ETPL and connect you to our referral pipeline.', image: '/images/pages/partners-pub-page-4.jpg' },
              { step: '3', title: 'Receive Referrals', desc: 'Funded students are referred to your programs. We handle enrollment coordination and reporting.', image: '/images/pages/partners-pub-page-7.jpg' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="relative h-44">
                  <Image src={item.image} alt={item.title} fill sizes="33vw" className="object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow">
                    {item.step}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Become an Approved Provider</h2>
          <p className="text-slate-300 mb-8">Apply to join our training provider network and start receiving funded student referrals.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partners/join" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-700 transition text-lg">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="bg-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition text-lg">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
