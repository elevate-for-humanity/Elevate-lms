import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowRight, Clock, DollarSign, Award, CheckCircle, Phone, Briefcase, GraduationCap, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Job Seekers | Elevate for Humanity',
  description: 'Short-term career training in healthcare, skilled trades, CDL, barbering, and technology. Most programs fully funded for eligible Indiana residents.',
};

const PROGRAMS = [
  { title: 'CNA Certification', sector: 'Healthcare', duration: '4–6 weeks', salary: '$30K–$42K', image: '/images/pages/cna-patient-care.jpg', href: '/programs/cna' },
  { title: 'HVAC Technician', sector: 'Skilled Trades', duration: '12 weeks', salary: '$48K–$80K', image: '/images/pages/hvac-unit.jpg', href: '/programs/hvac-technician' },
  { title: 'CDL Class A', sector: 'Transportation', duration: '4–6 weeks', salary: '$50K–$75K+', image: '/images/pages/cdl-driver-seat.jpg', href: '/programs/cdl-training' },
  { title: 'Welding', sector: 'Skilled Trades', duration: '12–16 weeks', salary: '$54K–$150K+', image: '/images/pages/welding-torch.jpg', href: '/programs/welding' },
  { title: 'IT Support / Help Desk', sector: 'Technology', duration: '8–12 weeks', salary: '$35K–$60K', image: '/images/pages/it-helpdesk-desk.jpg', href: '/programs/it-help-desk' },
  { title: 'Barber Apprenticeship', sector: 'Personal Services', duration: '12–18 months', salary: '$30K–$60K+', image: '/images/pages/barber-client-chair.jpg', href: '/programs/barber-apprenticeship' },
];

export default function ForStudentsPage() {
  return (
    <div className="bg-white">

      {/* HERO — image only, no text on frame */}
      <section className="relative h-[340px] sm:h-[460px] overflow-hidden">
        <Image src="/images/pages/for-students-hero.jpg" alt="Job seekers in workforce training" fill sizes="100vw" className="object-cover object-center" priority />
      </section>

      {/* Headline — below the image */}
      <section className="pt-8 pb-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">For Job Seekers</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight max-w-2xl">A real career in weeks — not years.</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl leading-relaxed mb-6">Short-term training in healthcare, trades, CDL, barbering, and technology. Most programs are fully funded for eligible Indiana residents.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg text-sm transition-colors">Apply Now</Link>
            <Link href="/programs" className="border border-slate-300 text-slate-700 font-semibold px-7 py-3 rounded-lg text-sm hover:bg-slate-50 transition-colors">View All Programs</Link>
          </div>
        </div>
      </section>

      {/* WHY ELEVATE */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Why Elevate</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Built for working adults</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <DollarSign className="w-5 h-5 text-brand-green-600" />, title: 'Most programs are free', desc: 'WIOA, Workforce Ready Grant, and Indiana state funding cover tuition, books, tools, and exam fees for eligible participants.' },
              { icon: <Clock className="w-5 h-5 text-brand-blue-600" />, title: 'Weeks, not years', desc: 'Programs run 4 to 16 weeks. You can be credentialed and job-ready before the end of the quarter.' },
              { icon: <Award className="w-5 h-5 text-brand-red-600" />, title: 'Real credentials', desc: 'Every program ends with a nationally recognized certification — EPA, CompTIA, NCCER, Indiana ISDH, or DOL Registered Apprenticeship.' },
              { icon: <Briefcase className="w-5 h-5 text-slate-600" />, title: 'Job placement support', desc: 'Resume building, interview prep, and direct introductions to hiring employers. Many students have offers before their last day of class.' },
              { icon: <MapPin className="w-5 h-5 text-slate-600" />, title: 'Indianapolis-based', desc: 'Training happens at our Indianapolis facility. Employer partners are local — you build a network in the city where you live and work.' },
              { icon: <GraduationCap className="w-5 h-5 text-slate-600" />, title: 'No prior experience needed', desc: 'Most programs have no prerequisites. If you can commit to showing up and doing the work, we can get you credentialed.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="mb-3">{icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Programs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Popular programs for job seekers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((p) => (
              <Link key={p.title} href={p.href} className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-brand-red-300 hover:shadow-lg transition-all">
                <div className="relative w-full flex-shrink-0" style={{ aspectRatio: '16/9' }}>
                  <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" />
                  <span className="absolute top-3 left-3 bg-white/90 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">{p.sector}</span>
                  <span className="absolute top-3 right-3 bg-brand-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">Funded</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-extrabold text-slate-900 text-base mb-3">{p.title}</h3>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-brand-green-700 font-bold text-sm">{p.salary}</p>
                      <p className="text-slate-400 text-xs">{p.duration}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-brand-red-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">Learn more <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/programs" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold px-7 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm">
              View All Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">The Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10">From first call to first paycheck</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Check your eligibility', desc: 'Register at Indiana Career Connect and meet with a WorkOne case manager. They determine your funding — free, no obligation.' },
              { num: '02', title: 'Apply to Elevate', desc: 'Submit your application online. Takes 5 minutes. An advisor contacts you within one business day to confirm your program and start date.' },
              { num: '03', title: 'Complete your training', desc: 'Attend classes, complete hands-on labs, and prepare for your certification exam. All tools and materials are provided.' },
              { num: '04', title: 'Get placed', desc: 'Career services builds your resume, preps you for interviews, and connects you directly with hiring employers in Indianapolis.' },
            ].map((s) => (
              <div key={s.num} className="bg-white border border-slate-200 rounded-2xl p-5">
                <p className="text-brand-red-600 font-extrabold text-xs uppercase tracking-widest mb-3">{s.num}</p>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="py-14 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Funding</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">You may qualify for free training</h2>
              <p className="text-slate-600 leading-relaxed mb-6">Federal and Indiana state workforce funding covers tuition, books, tools, and exam fees for eligible participants. The first step is a free appointment with WorkOne.</p>
              <div className="space-y-3 mb-6">
                {[
                  'WIOA Title I — federal funding for adults, dislocated workers, and youth 16–24',
                  'Workforce Ready Grant — Indiana state grant, no repayment required',
                  'Justice Reinvestment Initiative — Indiana DWD funding for justice-involved individuals',
                  "Buy Now, Pay Later — if you don't qualify for grants, we have payment options",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-600 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/wioa-eligibility" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors">Check My Eligibility</Link>
                <Link href="/funding" className="border border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-lg text-sm hover:bg-slate-50 transition-colors">All Funding Options</Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image src="/images/pages/wioa-meeting.jpg" alt="WorkOne career counseling appointment" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Ready to get started?</h2>
          <p className="text-red-100 max-w-xl mx-auto mb-8 leading-relaxed">Apply in 5 minutes. An advisor will contact you within one business day.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/start" className="bg-white text-brand-red-600 font-bold px-8 py-3.5 rounded-lg text-sm hover:bg-red-50 transition-colors">Apply Now</Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-3.5 rounded-lg text-sm hover:bg-white/10 transition-colors">
              <Phone className="w-4 h-4" /> Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
