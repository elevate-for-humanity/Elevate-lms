import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin, Phone, Mail, Clock, Award, CheckCircle2,
  Scissors, Sparkles, Hand, ChevronRight, Star,
  GraduationCap, Users, Shield, ArrowRight,
} from 'lucide-react';
import MesmerizedApplyForm from './MesmerizedApplyForm';

export const metadata: Metadata = {
  title: 'Mesmerized by Beauty Cosmetology Academy | Indianapolis, IN',
  description:
    'Cosmetology, esthetician, and nail technician programs at Mesmerized by Beauty Cosmetology Academy in Indianapolis. Sponsored by Elevate for Humanity. Earn your Indiana license through a registered apprenticeship.',
  alternates: { canonical: '/schools/mesmerized-by-beauty' },
  openGraph: {
    title: 'Mesmerized by Beauty Cosmetology Academy',
    description: 'Cosmetology · Esthetician · Nail Tech — Indianapolis, IN 46268',
    images: [{ url: '/images/pages/cosmetology-hero.jpg', width: 1200, height: 630 }],
  },
};

const PROGRAMS = [
  {
    slug: 'cosmetology-apprenticeship',
    icon: <Scissors className="w-7 h-7" />,
    color: 'bg-purple-600',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    label: 'Cosmetology',
    credential: 'Indiana Cosmetology License',
    hours: '1,500',
    duration: '12–18 months',
    description:
      'Full cosmetology training covering hair cutting, coloring, chemical services, skincare, and salon business management. Graduate with your Indiana cosmetology license.',
    outcomes: [
      'Hair cutting, coloring & chemical services',
      'Skincare and scalp treatments',
      'Salon business & client management',
      'Indiana IPLA cosmetology license',
    ],
  },
  {
    slug: 'esthetician-apprenticeship',
    icon: <Sparkles className="w-7 h-7" />,
    color: 'bg-rose-600',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    label: 'Esthetician',
    credential: 'Indiana Esthetician License',
    hours: '700',
    duration: '6–9 months',
    description:
      'Skin care, facials, waxing, and advanced esthetic treatments. Graduate with your Indiana esthetician license and the skills to work in spas, salons, and medical settings.',
    outcomes: [
      'Facials, peels & advanced skin treatments',
      'Waxing & hair removal',
      'Makeup application',
      'Indiana IPLA esthetician license',
    ],
  },
  {
    slug: 'nail-technician-apprenticeship',
    icon: <Hand className="w-7 h-7" />,
    color: 'bg-pink-600',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
    label: 'Nail Technician',
    credential: 'Indiana Nail Tech License',
    hours: '450',
    duration: '4–6 months',
    description:
      'Manicures, pedicures, acrylics, gel, nail art, and sanitation protocols. The fastest path to your Indiana nail technician license.',
    outcomes: [
      'Manicures, pedicures & nail art',
      'Acrylics, gel & dip powder',
      'Sanitation & infection control',
      'Indiana IPLA nail technician license',
    ],
  },
];

const STATS = [
  { value: '3', label: 'Licensed programs' },
  { value: 'IPLA', label: 'State-licensed' },
  { value: 'DOL', label: 'Registered apprenticeship' },
  { value: '100%', label: 'Hands-on training' },
];

export default function MesmerizedByBeautyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Hero image */}
        <div className="relative h-[55vh] min-h-[380px] max-h-[600px] w-full overflow-hidden">
          <Image
            src="/images/pages/cosmetology-hero.jpg"
            alt="Cosmetology students training at Mesmerized by Beauty Academy"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
          {/* Sponsor bug — top left, per hero standard */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Image src="/images/logo.png" alt="Elevate for Humanity" width={20} height={20} className="object-contain" />
            <span className="text-xs font-semibold text-slate-700">Sponsored by Elevate for Humanity</span>
          </div>
        </div>

        {/* Below-hero content — per hero standard, no text on video/image */}
        <div className="bg-white border-b border-slate-100 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Indianapolis, Indiana · DOL Registered Apprenticeship
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 leading-tight">
              Mesmerized by Beauty<br className="hidden sm:block" /> Cosmetology Academy
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Earn your Indiana cosmetology, esthetician, or nail technician license through hands-on apprenticeship training at our Indianapolis academy. Sponsored by Elevate for Humanity.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#apply"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base">
                Apply Now <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#programs"
                className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-purple-300 text-slate-800 font-bold px-7 py-3.5 rounded-xl transition-colors text-base">
                View Programs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="bg-purple-700 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-purple-200 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">About the Academy</p>
              <h2 className="text-3xl font-black text-slate-900 mb-5">
                A full-service beauty school in the heart of Indianapolis
              </h2>
              <p className="text-slate-600 leading-relaxed mb-5">
                Mesmerized by Beauty Cosmetology Academy offers cosmetology, esthetician, and nail technician programs through a registered apprenticeship model. Students train hands-on in a real salon environment, earning their Indiana state license while building a professional portfolio.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                In partnership with <strong>Elevate for Humanity</strong>, our students gain access to the Elevate LMS for theory coursework, DOL-registered apprenticeship sponsorship, and career placement support — all under one roof.
              </p>
              <div className="space-y-3">
                {[
                  'Indiana IPLA-licensed programs',
                  'DOL Registered Apprenticeship — earn while you learn',
                  'Elevate LMS theory coursework included',
                  'Career placement support after graduation',
                  'Small class sizes — personalized instruction',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden h-64">
                <Image
                  src="/images/beauty/program-beauty-training.jpg"
                  alt="Beauty training at Mesmerized by Beauty Academy"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              {/* Location card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Campus Location</p>
                    <p className="text-slate-600 text-sm">8325 Michigan Road</p>
                    <p className="text-slate-600 text-sm">Indianapolis, IN 46268</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <a href="mailto:mesmerizedbybeautyl@yahoo.com" className="text-purple-700 text-sm hover:underline">
                    mesmerizedbybeautyl@yahoo.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-slate-600 text-sm">Sponsored by Elevate for Humanity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAMS ─────────────────────────────────────────────────── */}
      <section id="programs" className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">Programs Offered</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Three paths to your Indiana license</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              All programs are offered as DOL Registered Apprenticeships. You train in a licensed salon, earn wages, and graduate with a state license.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PROGRAMS.map((prog) => (
              <div key={prog.slug} className={`bg-white rounded-2xl border-2 ${prog.borderColor} overflow-hidden flex flex-col`}>
                {/* Program header */}
                <div className={`${prog.color} p-6 text-white`}>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    {prog.icon}
                  </div>
                  <h3 className="text-xl font-black mb-1">{prog.label}</h3>
                  <p className="text-white/80 text-sm">{prog.credential}</p>
                </div>

                {/* Program body */}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">{prog.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className={`${prog.lightColor} rounded-xl p-3 text-center`}>
                      <Clock className={`w-4 h-4 ${prog.textColor} mx-auto mb-1`} />
                      <p className={`text-xs font-bold ${prog.textColor}`}>{prog.hours} hours</p>
                      <p className="text-xs text-slate-500">required</p>
                    </div>
                    <div className={`${prog.lightColor} rounded-xl p-3 text-center`}>
                      <GraduationCap className={`w-4 h-4 ${prog.textColor} mx-auto mb-1`} />
                      <p className={`text-xs font-bold ${prog.textColor}`}>{prog.duration}</p>
                      <p className="text-xs text-slate-500">to complete</p>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {prog.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className={`w-4 h-4 ${prog.textColor} flex-shrink-0 mt-0.5`} />
                        {o}
                      </li>
                    ))}
                  </ul>

                  <a href={`#apply?program=${prog.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('apply');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-center ${prog.color} hover:opacity-90 text-white font-bold py-3 rounded-xl transition-opacity text-sm flex items-center justify-center gap-2`}>
                    Apply for {prog.label} <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARN WHILE YOU LEARN ─────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">Registered Apprenticeship</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">You get paid while you train</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              This is not a traditional school where you pay tuition and wait. As a DOL Registered Apprentice, you are placed at a licensed salon and earn wages from day one.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: '💵',
                title: 'Earn wages immediately',
                desc: 'You are employed at a partner salon from day one. Your training hours are paid work hours.',
              },
              {
                icon: '🚗',
                title: 'Transportation support',
                desc: 'Through our partnership with Impact, eligible apprentices can access car repair assistance and transportation support so getting to work is never a barrier.',
              },
              {
                icon: '📋',
                title: 'No tuition debt',
                desc: 'Workforce funding (WIOA) may cover your program costs. We help you apply — most students pay nothing out of pocket.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Eligibility pre-check */}
          <div className="bg-slate-900 rounded-2xl p-7">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-white mb-2">Are you eligible?</h3>
              <p className="text-slate-400 text-sm">Most people qualify. Check the basics before you apply.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {[
                { check: 'Age 16 or older', note: 'No upper age limit' },
                { check: 'High school diploma or GED', note: 'Or currently enrolled' },
                { check: 'Authorized to work in the US', note: 'Citizen, resident, or work visa' },
                { check: 'Able to commit to training schedule', note: 'Full-time or part-time tracks available' },
                { check: 'No prior cosmetology license required', note: 'Beginners welcome' },
                { check: 'Indiana resident preferred', note: 'Out-of-state applicants considered' },
              ].map((item) => (
                <div key={item.check} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-semibold">{item.check}</p>
                    <p className="text-slate-400 text-xs">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-sm">
              Not sure if you qualify?{' '}
              <a href="mailto:mesmerizedbybeautyl@yahoo.com" className="text-purple-400 hover:text-purple-300 font-semibold">
                Email us before applying
              </a>{' '}
              — we will tell you honestly.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + TIMELINE ──────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">Enrollment Process</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">What happens after you apply</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              From application to first paid shift — here is the exact timeline.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-100 hidden sm:block" />

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  time: 'Today',
                  title: 'Submit your application',
                  desc: 'Free to apply. Takes 3 minutes. You will receive a confirmation email immediately.',
                  color: 'bg-purple-600',
                },
                {
                  step: '02',
                  time: 'Within 2–3 business days',
                  title: 'Admissions interview',
                  desc: 'A quick call or in-person visit at 8325 Michigan Road. We review your goals, answer your questions, and confirm your program choice.',
                  color: 'bg-purple-600',
                },
                {
                  step: '03',
                  time: 'Within 1 week of acceptance',
                  title: 'Funding & paperwork',
                  desc: 'We help you apply for WIOA workforce funding if eligible. DOL apprenticeship registration is completed. Most students pay nothing out of pocket.',
                  color: 'bg-purple-600',
                },
                {
                  step: '04',
                  time: 'Week 2–3',
                  title: 'Salon placement',
                  desc: 'You are matched with a licensed partner salon near you. Your schedule is set. Transportation support through Impact is arranged if needed.',
                  color: 'bg-purple-600',
                },
                {
                  step: '05',
                  time: 'Week 3–4',
                  title: 'First paid shift',
                  desc: 'You start training and earning. Access the Elevate LMS for theory coursework on your phone. Your supervisor logs and approves your hours weekly.',
                  color: 'bg-emerald-600',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-5 sm:gap-8 items-start">
                  <div className={`w-12 h-12 ${item.color} text-white rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm z-10`}>
                    {item.step}
                  </div>
                  <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ELEVATE PARTNERSHIP ───────────────────────────────────────── */}
      <section className="py-14 bg-purple-700">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                <Image src="/images/logo.png" alt="Elevate for Humanity" width={52} height={52} className="object-contain" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-purple-200 text-sm font-semibold uppercase tracking-widest mb-2">Official Partnership</p>
              <h2 className="text-2xl font-black text-white mb-3">Sponsored by Elevate for Humanity</h2>
              <p className="text-purple-100 leading-relaxed">
                Mesmerized by Beauty Cosmetology Academy is an official Elevate for Humanity partner school. Students gain access to the Elevate LMS for theory coursework, DOL-registered apprenticeship sponsorship, RAPIDS compliance reporting, and career placement support — all at no additional cost.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-10">
            {[
              { icon: <Award className="w-5 h-5" />, label: 'DOL Registered Apprenticeship', desc: 'Federally recognized credential' },
              { icon: <GraduationCap className="w-5 h-5" />, label: 'Elevate LMS Theory', desc: 'Online coursework included' },
              { icon: <Users className="w-5 h-5" />, label: 'Career Placement', desc: 'Job placement support' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                <div className="text-purple-200 flex justify-center mb-2">{item.icon}</div>
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-purple-200 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / TRUST ─────────────────────────────────────── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">Why Choose Us</p>
            <h2 className="text-3xl font-black text-slate-900">Built for working adults</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="w-6 h-6 text-purple-600" />,
                title: 'Flexible scheduling',
                desc: 'Full-time and part-time tracks available. Train around your life.',
              },
              {
                icon: <Star className="w-6 h-6 text-purple-600" />,
                title: 'Real salon experience',
                desc: 'You train on real clients in a licensed salon — not just mannequins.',
              },
              {
                icon: <Shield className="w-6 h-6 text-purple-600" />,
                title: 'State-licensed & accredited',
                desc: 'Indiana IPLA-licensed programs. Your credential is recognized statewide.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ─────────────────────────────────────────── */}
      <section id="apply" className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-purple-600 font-semibold text-sm uppercase tracking-widest mb-3">Enrollment</p>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Apply to a program</h2>
            <p className="text-slate-600">
              Free to apply. Our admissions team will contact you within 2–3 business days.
            </p>
          </div>
          <MesmerizedApplyForm />
        </div>
      </section>

      {/* ── FOOTER CTA ───────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to start your beauty career?</h2>
          <p className="text-slate-400 mb-6">Apply today — no cost to apply, no commitment required.</p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a href="#apply"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors">
              Apply Now <ArrowRight className="w-4 h-4" />
            </a>
            <a href="mailto:mesmerizedbybeautyl@yahoo.com"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3.5 rounded-xl transition-colors">
              <Mail className="w-4 h-4" /> Email the School
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 8325 Michigan Road, Indianapolis, IN 46268</span>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> mesmerizedbybeautyl@yahoo.com</span>
          </div>
          <p className="text-slate-600 text-xs mt-6">
            Sponsored by{' '}
            <Link href="/" className="text-purple-400 hover:text-purple-300">Elevate for Humanity</Link>
            {' '}· A DOL Registered Apprenticeship Program
          </p>
        </div>
      </section>
    </div>
  );
}
