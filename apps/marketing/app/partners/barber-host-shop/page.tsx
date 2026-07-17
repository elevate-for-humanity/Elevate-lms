import { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, DollarSign, Users, Calendar, CheckCircle, Phone, Building2, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Barber Host Shop Partnership | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Host a barbershop apprenticeship. Partner with us to train the next generation of barbers while growing your business.',
};

const BENEFITS = [
  { icon: DollarSign, title: 'Earn While Training', desc: 'Apprentices work in your shop from day one, bringing in revenue while they learn.' },
  { icon: Users, title: 'Build Your Team', desc: 'Recruit and train talent specifically for your business culture and specialty.' },
  { icon: Award, title: 'DOL Registered', desc: 'Our apprenticeship is DOL-registered, giving your program credibility and recognition.' },
  { icon: Calendar, title: 'Flexible Schedule', desc: 'Training fits your business hours. We handle the classroom portion.' },
];

const REQUIREMENTS = [
  'Licensed barbershop in good standing with Indiana State Board of Cosmetology',
  'At least one licensed barber with 3+ years of experience to serve as mentor',
  'Physical space for apprentice to work on clients',
  'Willingness to commit to 12-24 month apprenticeship duration',
  'Background check clearance for shop owner and mentor',
  'Commercial liability insurance',
];

const APPRENTICE_INFO = [
  'Must be 16+ years old',
  'High school diploma or GED preferred',
  'No prior barber license required',
  'Committed to completing 1500+ hours of training',
  'Professional attitude and customer service skills',
];

export default function BarberHostShopPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative flex items-end overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" style={{ minHeight: 'clamp(260px, 45vw, 520px)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 sm:pb-12 w-full text-white">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/partners" className="hover:text-white transition-colors">Partners</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Barber Host Shop</span>
          </nav>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-brand-red-600/20 text-brand-red-300 border border-brand-red-500/30">
            <Scissors className="w-4 h-4" /> Host a Site
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">Host a Barbershop Apprenticeship</h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Partner with us to train the next generation of barbers while building your team and growing your business.
          </p>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Why Become a Host Shop?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <benefit.icon className="w-10 h-10 text-brand-red-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">How It Works</h2>
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Apply', desc: 'Complete our host shop application. We review your shop and mentor qualifications.' },
                { step: '2', title: 'Match', desc: 'We match you with an apprentice who fits your shop\'s culture and specialty.' },
                { step: '3', title: 'Train', desc: 'Your apprentice works in your shop while attending our RTI classroom training.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">{item.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Host Shop Requirements */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Host Shop Requirements</h2>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {REQUIREMENTS.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Apprentice Info */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Apprentice Qualifications</h2>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {APPRENTICE_INFO.map((info, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                    <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span>{info}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ROI Calculator */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Apprentice ROI</h2>
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-extrabold text-brand-red-400 mb-2">$0</p>
                <p className="text-slate-300 text-sm">Your cost to host an apprentice</p>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-brand-red-400 mb-2">500+</p>
                <p className="text-slate-300 text-sm">Hours of productive work in 12 months</p>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-brand-red-400 mb-2">$10K</p>
                <p className="text-slate-300 text-sm">Federal tax credit per apprentice</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-slate-50 rounded-2xl p-8 sm:p-12 border border-slate-200 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Host?</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Apply to become a host shop partner. We&apos;ll review your application and schedule a site visit within 2 weeks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/partners/barber-host-shop/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Apply to Host
            </Link>
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-bold px-8 py-4 rounded-xl transition-colors text-lg inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" /> Call for Info
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
