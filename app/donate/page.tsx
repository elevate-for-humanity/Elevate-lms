'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SITE_STATS } from '@/lib/site-stats';
import {
  Heart, Users, Award, Briefcase, CheckCircle, ArrowRight,
  RefreshCw, DollarSign, Star, Shield, Globe, ChevronDown,
} from 'lucide-react';


const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

const IMPACT_STATS = [
  { icon: Users, value: 'Many', label: 'Students Trained', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Award, value: '200+', label: 'Credentials Issued', color: 'text-brand-green-600', bg: 'bg-brand-green-50' },
  { icon: Briefcase, value: '150+', label: 'Jobs Placed', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Globe, value: SITE_STATS.programsOfferedDisplay, label: 'Programs Offered', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const DONATION_IMPACT = [
  { amount: 25, impact: 'Covers one week of learning materials for a student' },
  { amount: 50, impact: 'Funds a credential exam fee for one participant' },
  { amount: 100, impact: 'Sponsors one month of workforce training for a student' },
  { amount: 250, impact: 'Covers full program supplies for one participant' },
  { amount: 500, impact: 'Funds a complete certification pathway for one student' },
  { amount: 1000, impact: 'Sponsors a full scholarship for one program participant' },
];

const TESTIMONIALS = [
  {
    quote: "Elevate gave me the skills and credentials I needed to start my career. I went from unemployed to earning $18/hour in 8 weeks.",
    name: "Program Graduate",
    program: "Barbering Apprenticeship",
  },
  {
    quote: "I never thought I could afford professional training. Sit Selfish and Elevate made it possible at no cost to me.",
    name: "Program Graduate",
    program: "CNA Certification",
  },
  {
    quote: "The support I received went beyond just training — they helped me with job placement and career coaching.",
    name: "Program Graduate",
    program: "HVAC Technician",
  },
];

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDedication, setShowDedication] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;
  const impactMessage = DONATION_IMPACT.find(d => d.amount <= finalAmount)?.impact
    ?? DONATION_IMPACT[0].impact;

  const handleDonate = async () => {
    setError('');
    if (!finalAmount || finalAmount < 1) {
      setError('Please enter a valid donation amount.');
      return;
    }
    if (!donorEmail) {
      setError('Please enter your email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          recurring,
          donor_name: donorName || undefined,
          donor_email: donorEmail,
          dedication: dedication || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process donation.');
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image sizes="100vw"
            src="/images/hero/hero-community.webp"
            alt="Community workforce training"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Heart className="w-4 h-4 text-red-400" />
            Sit Selfish Inc × {PLATFORM_DEFAULTS.orgName}
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Invest in a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Workforce Revolution
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Your donation funds free career training, industry credentials, and job placement
            for underserved communities in Indianapolis and beyond.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-green-400" /> 501(c)(3) Tax Deductible</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-green-400" /> 100% Goes to Programs</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-brand-green-400" /> Secure Stripe Checkout</span>
          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {IMPACT_STATS.map((stat) => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-6 text-center`}>
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-600 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* LEFT — Story */}
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-6">
              Why Your Gift Matters
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              <strong>Sit Selfish Inc</strong> is a 501(c)(3) nonprofit partnered with
              <strong> {PLATFORM_DEFAULTS.orgName}</strong> to deliver no-cost workforce training
              to individuals who face barriers to employment — including justice-involved
              individuals, WIOA-eligible participants, and underserved communities across Indiana.
            </p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Every dollar you give directly funds tuition, exam fees, supplies, and career
              coaching for participants who could not otherwise afford professional credentials.
            </p>

            {/* What your gift funds */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-slate-900 mb-4">Your ${finalAmount || 100} gift:</h3>
              <p className="text-slate-700 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-green-600 mt-0.5 shrink-0" />
                {impactMessage}
              </p>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-5">
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic mb-3">"{t.quote}"</p>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.program}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Donation Form */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Make a Donation</h2>
              <p className="text-slate-500 mb-6">100% tax-deductible · Secure checkout</p>

              {/* One-time / Monthly toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setRecurring(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${!recurring ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
                >
                  One-Time
                </button>
                <button
                  onClick={() => setRecurring(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${recurring ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Monthly
                </button>
              </div>

              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(''); }}
                    className={`py-3 rounded-xl font-bold text-sm transition border-2 ${
                      amount === a && !customAmount
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="relative mb-6">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              {/* Donor info */}
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-900"
                />
                <input
                  type="email"
                  placeholder="Email address *"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-900"
                />
              </div>

              {/* Dedication */}
              <button
                onClick={() => setShowDedication(!showDedication)}
                className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-4"
              >
                <ChevronDown className={`w-4 h-4 transition ${showDedication ? 'rotate-180' : ''}`} />
                Dedicate this gift (optional)
              </button>
              {showDedication && (
                <input
                  type="text"
                  placeholder="In honor of / in memory of..."
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-900 mb-4"
                />
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleDonate}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-lg py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-200"
              >
                {isSubmitting ? 'Processing...' : (
                  <>
                    <Heart className="w-5 h-5" />
                    {recurring ? `Give $${finalAmount || '...'}/month` : `Donate $${finalAmount || '...'}`}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secured by Stripe</span>
                <span>·</span>
                <span>501(c)(3) Tax Deductible</span>
                <span>·</span>
                <span>EIN on receipt</span>
              </div>
            </div>

            {/* Other ways to give */}
            <div className="mt-6 bg-slate-50 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-3">Other Ways to Give</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />Employer matching — ask your HR team about Benevity or Deed</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />Donor-advised fund — use your DAF to grant to Sit Selfish Inc</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />Corporate sponsorship — <Link href="/partners" className="text-blue-600 underline">become a partner</Link></li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />Volunteer your expertise — <Link href="/contact" className="text-blue-600 underline">contact us</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">See the Impact Your Gift Creates</h2>
          <p className="text-blue-100 text-lg mb-8">
            Every enrollment, credential, and job placement is tracked in real time.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/impact" className="bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition flex items-center gap-2">
              View Live Impact Stats <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/programs" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
