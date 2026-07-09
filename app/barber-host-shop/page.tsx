import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Users, DollarSign, CheckCircle, ChevronRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config`;

export const metadata: Metadata = {
  title: `Barber Host Shop | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Host barber apprentices in your barbershop. Earn OJT reimbursement, Instructor the next generation, and build your pipeline.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-host-shop' },
};

const benefits = [
  { icon: DollarSign, title: 'OJT Wage Reimbursement', desc: 'Get reimbursed for on-the-job training hours.' },
  { icon: Users, title: 'Build Your Team', desc: 'Train apprentices to your standards and hire when ready.' },
  { icon: Scissors, title: 'Instructor the Next Generation', desc: 'Give back to your community and grow the trade.' },
];

const requirements = [
  'Licensed barbershop in Indiana',
  'Active barber license for yourself',
  'Space for apprentice workstation',
  'Willingness to Instructor and train',
];

export default function BarberHostShopPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Scissors className="w-4 h-4" /> Barber Host Shop
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Host Barber Apprentices
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Earn OJT reimbursement, Instructor future barbers, and build your team. Partner with {PLATFORM_DEFAULTS.orgName} today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/partners/barber-host-shop/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Apply to Host
            </Link>
            <Link href="/programs/barber-apprenticeship" className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              View Program
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Why Become a Host Shop?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 border border-slate-200 text-center">
                <b.icon className="w-12 h-12 text-brand-red-600 mx-auto mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Host Shop Requirements</h2>
              <ul className="space-y-4">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <h3 className="font-bold text-xl mb-4">Ready to Get Started?</h3>
              <p className="text-slate-300 mb-6">Apply online or call us to learn more about hosting barber apprentices.</p>
              <Link href="/partners/barber-host-shop/apply" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                Apply Now <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Have Questions?</h2>
          <p className="text-lg text-red-100 mb-8">Contact us to learn more about becoming a host shop.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/partners/barber-host-shop/apply" className="bg-white text-brand-red-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-colors text-lg">
              Apply Now
            </Link>
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border-2 border-white text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
