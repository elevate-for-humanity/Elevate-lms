import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Clock, DollarSign, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certification Training Programs | Elevate for Humanity',
  description: 'Fast-track certification training in healthcare, skilled trades, CDL, technology, and barber apprenticeship. Many programs are free through WIOA and WRG funding.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/training/certifications' },
};

const certPrograms = [
  { name: 'CNA — Certified Nursing Assistant', duration: '4-6 weeks', cost: 'Free with WIOA/WRG', image: '/images/pages/comp-cta-training.jpg', href: '/programs/healthcare' },
  { name: 'CDL — Commercial Driver License', duration: '4-8 weeks', cost: 'Free with WRG', image: '/images/pages/comp-cta-training.jpg', href: '/programs/cdl' },
  { name: 'HVAC Technician + EPA 608', duration: '8-12 weeks', cost: 'Free with WIOA', image: '/images/pages/comp-cta-training.jpg', href: '/programs/skilled-trades' },
  { name: 'Barber Apprenticeship', duration: '18-24 months', cost: 'Paid apprenticeship', image: '/images/pages/comp-cta-training.jpg', href: '/programs/barber-apprenticeship' },
  { name: 'Phlebotomy Technician', duration: '6-8 weeks', cost: 'Free with WIOA/WRG', image: '/images/pages/comp-cta-training.jpg', href: '/programs/healthcare' },
  { name: 'CPR/AED/First Aid (HSI)', duration: '1 day', cost: '$65-$85', image: '/images/pages/comp-cta-training.jpg', href: '/programs/cpr-first-aid' },
  { name: 'OSHA 10 / OSHA 30', duration: '2-4 days', cost: 'Included with trades programs', image: '/images/pages/comp-pathway-trades.jpg', href: '/programs/skilled-trades' },
  { name: 'Welding Certification', duration: '8-12 weeks', cost: 'Free with WIOA', image: '/images/pages/comp-pathway-trades.jpg', href: '/programs/skilled-trades' },
];

export default function CertificationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Training', href: '/programs' }, { label: 'Certifications' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/pages/training-page-1.jpg" alt="Certification training" fill className="object-cover" priority sizes="100vw" />
        
      </section>

      {/* Key Stats */}
      <section className="py-10 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <Clock className="w-6 h-6 text-brand-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">2-12</p>
              <p className="text-sm text-slate-400">Weeks to certify</p>
            </div>
            <div>
              <DollarSign className="w-6 h-6 text-brand-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">$0</p>
              <p className="text-sm text-slate-400">With WIOA/WRG funding</p>
            </div>
            <div>
              <MapPin className="w-6 h-6 text-brand-orange-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">Indianapolis</p>
              <p className="text-sm text-slate-400">In-person training</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">Available Certification Programs</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">Each program leads to an industry-recognized credential accepted by employers statewide.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {certPrograms.map((prog) => (
              <Link key={prog.name} href={prog.href} className="group rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow bg-white">
                <div className="relative h-36 overflow-hidden">
                  <Image src={prog.image} alt={prog.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-brand-blue-600 transition-colors">{prog.name}</h3>
                  <p className="text-xs text-slate-500 mb-1">{prog.duration}</p>
                  <p className="text-xs font-semibold text-brand-green-700">{prog.cost}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Get Certified?</h2>
          <p className="text-xl text-white/90 mb-10">Apply in minutes. Most students start training within 2-4 weeks.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg">Apply Now</Link>
            <Link href="/funding" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition">Check Funding</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
