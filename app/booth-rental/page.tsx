import type { Metadata } from 'next';
import Link from 'next/link';
import { Scissors, Sparkles, Flower2, Hand, CheckCircle2, ArrowRight, MapPin, Phone } from 'lucide-react';
import { BOOTH_RENTAL_TIERS } from '@/lib/programs/pricing';

export const metadata: Metadata = {
  title: 'Booth & Suite Rentals | Elevate for Humanity — Indianapolis',
  description: 'Rent a booth or suite at Elevate for Humanity in Indianapolis. Barber, cosmetology, esthetician, and nail tech spaces available. Weekly billing via Stripe. No long-term lease.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/booth-rental' },
};

const DISCIPLINE_DISPLAY = [
  {
    key: 'barber',
    icon: <Scissors className="w-7 h-7" />,
    color: 'bg-brand-blue-50 text-brand-blue-700',
    border: 'border-brand-blue-200',
    title: 'Barber Booth',
    rate: '$150/week',
    deposit: '$150 deposit',
    features: ['Private booth', 'Shared shampoo bowls', 'Wi-Fi included', 'Weekly auto-billing'],
  },
  {
    key: 'cosmetologist',
    icon: <Sparkles className="w-7 h-7" />,
    color: 'bg-purple-50 text-purple-700',
    border: 'border-purple-200',
    title: 'Cosmetology Booth',
    rate: '$150/week',
    deposit: '$150 deposit',
    features: ['Private booth', 'Shared shampoo bowls', 'Wi-Fi included', 'Weekly auto-billing'],
  },
  {
    key: 'esthetician',
    icon: <Flower2 className="w-7 h-7" />,
    color: 'bg-rose-50 text-rose-700',
    border: 'border-rose-200',
    title: 'Esthetician Suite',
    rate: '$160/week',
    deposit: 'No deposit',
    features: ['Private suite', 'Treatment table', 'Wi-Fi included', 'Weekly auto-billing'],
  },
  {
    key: 'nail_tech',
    icon: <Hand className="w-7 h-7" />,
    color: 'bg-pink-50 text-pink-700',
    border: 'border-pink-200',
    title: 'Nail Tech Booth',
    rate: '$150/week',
    deposit: '$150 deposit',
    features: ['Private booth', 'Ventilation system', 'Wi-Fi included', 'Weekly auto-billing'],
  },
];

export default function BoothRentalLandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold text-brand-blue-400 uppercase tracking-widest">Indianapolis, IN</span>
          <h1 className="text-4xl sm:text-5xl font-black mt-3 mb-5">Booth &amp; Suite Rentals</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Professional spaces for licensed barbers, cosmetologists, estheticians, and nail technicians.
            Weekly billing. No long-term lease. Card on file — automatic every Friday.
          </p>
          <Link
            href="/booth-rental/apply"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Apply for a Space <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Location */}
      <section className="py-8 px-4 bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue-600" />
            <span>8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-blue-600" />
            <a href="tel:3173143757" className="font-semibold text-brand-blue-600 hover:underline">(317) 314-3757</a>
          </div>
        </div>
      </section>

      {/* Spaces */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-3">Available Spaces</h2>
          <p className="text-center text-slate-500 mb-10">All spaces include utilities, Wi-Fi, and access to shared areas.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {DISCIPLINE_DISPLAY.map(d => (
              <div key={d.key} className={`rounded-2xl border-2 ${d.border} p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${d.color} flex items-center justify-center`}>
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{d.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-slate-900">{d.rate}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className={`text-xs font-semibold ${d.deposit === 'No deposit' ? 'text-emerald-600' : 'text-slate-500'}`}>{d.deposit}</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 mb-5">
                  {d.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/booth-rental/apply?discipline=${d.key}`}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                >
                  Apply for This Space <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Apply Online', desc: 'Fill out the application with your license number and select your space type.' },
              { step: '2', title: 'Pay & Sign', desc: 'Pay your deposit (if applicable) and sign the rental agreement digitally. Card saved for weekly billing.' },
              { step: '3', title: 'Move In', desc: 'Staff confirms your booth assignment within 1 business day. Weekly rent charged every Friday automatically.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Late fee policy */}
      <section className="py-12 px-4 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-bold text-slate-900 mb-3">Payment Policy</h3>
          <p className="text-sm text-slate-500">
            Rent is charged automatically every Friday. If payment fails: $25 late fee on day 1,
            $10/day for each additional day. Access is terminated at 5 days past due.
            Keep your card on file current to avoid interruption.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-brand-blue-700 text-white text-center">
        <h2 className="text-3xl font-black mb-4">Ready to rent a space?</h2>
        <p className="text-brand-blue-200 mb-8">A valid state license is required. Apply takes 5 minutes.</p>
        <Link
          href="/booth-rental/apply"
          className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-black px-8 py-4 rounded-xl text-lg hover:bg-brand-blue-50 transition-colors"
        >
          Apply Now <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

    </div>
  );
}
