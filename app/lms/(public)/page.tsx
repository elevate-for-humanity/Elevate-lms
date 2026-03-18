import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BookOpen, Clock, Award, ChevronRight, CheckCircle, Users, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Training Portal | Elevate for Humanity',
  description: 'Start your career training. Browse programs, enroll, and earn industry credentials.',
};

const PROGRAMS = [
  { title: 'HVAC Technician', desc: 'EPA 608 certification. Hands-on refrigeration and electrical training.', duration: '16 weeks', credential: 'EPA 608', image: '/images/pages/hvac-unit.jpg', slug: 'hvac-technician', funded: true },
  { title: 'CNA / Nursing Assistant', desc: 'State-certified nursing assistant training for healthcare careers.', duration: '6 weeks', credential: 'State CNA', image: '/images/pages/cna-hero.jpg', slug: 'cna', funded: true },
  { title: 'CDL Training', desc: 'Commercial driver license training. Class A and B available.', duration: '8 weeks', credential: 'CDL Class A', image: '/images/pages/cdl-hero.jpg', slug: 'cdl-training', funded: true },
  { title: 'Barber Apprenticeship', desc: 'Indiana DOL registered apprenticeship. Earn while you learn.', duration: '52 weeks', credential: 'Indiana Barber License', image: '/images/pages/barber-hero-main.jpg', slug: 'barber-apprenticeship', funded: true },
  { title: 'Medical Assistant', desc: 'Clinical and administrative skills for medical office careers.', duration: '12 weeks', credential: 'CCMA', image: '/images/pages/medical-assistant-hero.jpg', slug: 'medical-assistant', funded: true },
  { title: 'Cybersecurity Analyst', desc: 'CompTIA Security+ and network defense fundamentals.', duration: '12 weeks', credential: 'CompTIA Security+', image: '/images/pages/cybersecurity-hero.jpg', slug: 'cybersecurity-analyst', funded: false },
];

const STEPS = [
  { num: '1', title: 'Apply', desc: 'Free application. Takes 5 minutes. No prior experience required.' },
  { num: '2', title: 'Train', desc: 'Complete lessons, pass checkpoints, and build real skills.' },
  { num: '3', title: 'Get Certified', desc: 'Earn your industry credential and connect with employers.' },
];

const TOOLS = [
  { icon: BookOpen, label: 'Study Guides', href: '/lms/resources' },
  { icon: CheckCircle, label: 'Practice Exams', href: '/lms/quizzes' },
  { icon: Headphones, label: 'AI Tutor', href: '/lms/ai-tutor' },
  { icon: Users, label: 'Community', href: '/lms/community' },
];

export default async function LmsPublicPage() {
  // Logged-in users go straight to their dashboard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/lms/dashboard');
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <Image src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" width={120} height={32} className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/programs" className="text-sm text-slate-600 hover:text-slate-900 font-medium hidden sm:block">Browse Programs</Link>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium border border-slate-200 px-3 py-1.5 rounded-lg">Sign In</Link>
            <Link href="/programs" className="text-sm bg-slate-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-700 transition">Enroll Now</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-brand-red-600 uppercase tracking-widest mb-4">Elevate for Humanity · Career Training</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-5">
            Start Your Training.<br className="hidden sm:block" /> Build Your Career.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Industry-recognized credentials. Workforce funding available. Real job outcomes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login?redirect=/lms/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-xl text-base transition">
              Enter Student Portal <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/programs" className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-slate-200 hover:border-slate-400 text-slate-900 font-bold px-8 py-4 rounded-xl text-base transition">
              Browse Programs
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">Free to apply · WIOA funding available for eligible Indiana residents</p>
        </div>
      </section>

      {/* PROGRAM GRID */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Available Programs</h2>
            <p className="text-slate-500 text-base">Most programs are fully funded for Indiana residents.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROGRAMS.map(p => (
              <div key={p.slug} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                  {p.funded && (
                    <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FUNDED</span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{p.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.desc}</p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" />{p.duration}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><Award className="w-3 h-3" />{p.credential}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/programs/${p.slug}`} className="flex-1 text-center text-sm font-semibold text-slate-700 border border-slate-200 py-2 rounded-lg hover:bg-slate-50 transition">View Program</Link>
                    <Link href={`/programs/${p.slug}/apply`} className="flex-1 text-center text-sm font-bold text-white bg-brand-red-600 hover:bg-brand-red-700 py-2 rounded-lg transition">Enroll Now</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition">
              View All Programs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white text-xl font-extrabold flex items-center justify-center mb-4">{s.num}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDING STRIP */}
      <section className="py-12 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Funding Available for Indiana Residents</h3>
            <p className="text-slate-500 text-sm">WIOA, WorkOne, and employer-sponsored training may cover your full tuition.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-700 border border-slate-200 bg-white px-5 py-2.5 rounded-xl hover:bg-slate-50 transition text-center">Indiana Career Connect →</a>
            <Link href="/programs/federal-funded" className="text-sm font-semibold text-white bg-slate-900 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-center">Check My Eligibility</Link>
          </div>
        </div>
      </section>

      {/* STUDENT TOOLS */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Student Tools</h2>
          <p className="text-slate-500 text-base mb-10">Everything you need to study, practice, and succeed.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TOOLS.map(t => {
              const Icon = t.icon;
              return (
                <Link key={t.label} href={t.href} className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition group">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-slate-900 flex items-center justify-center transition">
                    <Icon className="w-5 h-5 text-slate-600 group-hover:text-white transition" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to Start?</h2>
          <p className="text-slate-400 text-base mb-8">Create your account and enroll in minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login?redirect=/lms/dashboard" className="w-full sm:w-auto bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl text-base transition">Enter Student Portal</Link>
            <Link href="/programs" className="w-full sm:w-auto border-2 border-slate-600 hover:border-slate-400 text-white font-bold px-8 py-4 rounded-xl text-base transition">Browse Programs</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
