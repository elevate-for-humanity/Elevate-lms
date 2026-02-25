'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createBrowserClient } from '@supabase/ssr';
import {
  Clock, DollarSign, TrendingUp, ArrowRight,
  Award, Calendar, ChevronDown, ChevronUp,
  GraduationCap, Briefcase, Shield,
} from 'lucide-react';

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface ProgramData {
  title: string;
  description: string;
  estimated_weeks: number | null;
  estimated_hours: number | null;
  salary_min: number | null;
  salary_max: number | null;
  credential_name: string | null;
  career_outcomes: string[] | null;
  what_you_learn: string[] | null;
  placement_rate: number | null;
  completion_rate: number | null;
  total_cost: string | null;
  industry_demand: string | null;
}

export default function HVACProgramContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [program, setProgram] = useState<ProgramData | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    Promise.all([
      supabase
        .from('programs')
        .select('title, description, estimated_weeks, estimated_hours, salary_min, salary_max, credential_name, career_outcomes, what_you_learn, placement_rate, completion_rate, total_cost, industry_demand')
        .eq('slug', 'hvac-technician')
        .single(),
      supabase
        .from('course_modules')
        .select('id, title, description, order_index')
        .eq('course_id', 'f0593164-55be-5867-98e7-8a86770a8dd0')
        .order('order_index'),
    ]).then(([programRes, modulesRes]) => {
      if (programRes.data) setProgram(programRes.data as ProgramData);
      if (modulesRes.data) setModules(modulesRes.data as CourseModule[]);
    });
  }, []);

  const faqs = [
    {
      question: "Do I need any experience to enroll?",
      answer: "No. This program is built for complete beginners. We start with the basics — what heating and cooling systems are, how they work, and how to work on them safely."
    },
    {
      question: "How long is the program?",
      answer: "15 weeks (approximately 160 clock hours). That includes 110 hours of classroom instruction and 50 hours of on-the-job training at employer partner sites."
    },
    {
      question: "How much does it cost?",
      answer: "If you qualify for WIOA or Workforce Ready Grant funding through WorkOne, your tuition may be fully covered. Self-pay tuition is $5,000 with weekly payment plans, Affirm, and Sezzle financing available."
    },
    {
      question: "What certifications do I get?",
      answer: "6 credentials: EPA 608 Universal (required by federal law to handle refrigerants), Residential HVAC 1 & 2, OSHA 30 Safety, CPR/First Aid, and Rise Up."
    },
    {
      question: "What jobs can I get after this?",
      answer: "HVAC Service Technician, Installation Specialist, or Maintenance Technician. Starting pay is $18–22/hour ($38K–$46K/year). Experienced technicians earn $60K–$80K+."
    },
    {
      question: "Can I work while in the program?",
      answer: "Yes. Flexible scheduling with day and evening options. Online coursework is self-paced. Most students keep their current job while training."
    },
    {
      question: "What is OJT?",
      answer: "On-the-Job Training — 50 hours of supervised, hands-on work at an HVAC employer site. You apply classroom skills to real service calls, installations, and maintenance under a licensed technician."
    }
  ];

  const credentials = [
    { name: 'EPA 608 Universal Certification', issuer: 'EPA-approved certifying organization', required: true },
    { name: 'Residential HVAC Certification 1', issuer: 'Elevate for Humanity', required: false },
    { name: 'Residential HVAC Certification 2', issuer: 'Elevate for Humanity', required: false },
    { name: 'OSHA 30 Safety Certification', issuer: 'OSHA / DOL', required: false },
    { name: 'CPR / First Aid', issuer: 'American Heart Association', required: false },
    { name: 'Rise Up', issuer: 'National Retail Federation Foundation', required: false },
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/hvac-technician.mp4" />

      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'HVAC Technician' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-semibold text-brand-blue-600 uppercase tracking-wide mb-2">15-Week Program</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">HVAC Technician Training</h1>
              <p className="text-lg text-gray-600 mb-6">
                Earn 6 industry credentials including EPA 608 Universal Certification. 110 hours of classroom instruction plus 50 hours of on-the-job training at employer partner sites.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Clock, label: 'Duration', value: '15 Weeks' },
                  { icon: Award, label: 'Credentials', value: '6 Included' },
                  { icon: DollarSign, label: 'Starting Salary', value: '$38K–$46K' },
                  { icon: TrendingUp, label: 'Job Demand', value: '4-Star IN Top Job' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <stat.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="font-semibold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/apply/student?program=hvac-technician" className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition">
                  Apply with Workforce Funding
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link href="/programs/hvac-technician/apply" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition">
                  Enroll &amp; Pay Tuition
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Workforce funding (WIOA / Workforce Ready Grant) may cover full tuition. Self-pay: $5,000 with installment plans.
              </p>
            </div>

            <div className="relative h-80 lg:h-[420px] rounded-2xl overflow-hidden">
              <Image src="/images/trades/hero-program-hvac.jpg" alt="HVAC technician working on a commercial air conditioning unit" fill quality={90} className="object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What You&apos;ll Learn</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">Hands-on training covering residential and light commercial HVAC systems.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'HVAC Fundamentals', desc: 'Heating, ventilation, air conditioning, and refrigeration principles. System types, components, and how they work together.' },
              { title: 'Electrical for HVAC', desc: 'Wiring diagrams, circuit testing, motor controls, and electrical safety. Read schematics and troubleshoot electrical faults.' },
              { title: 'Refrigerant Handling', desc: 'EPA 608 exam prep — refrigerant types, recovery, recycling, and reclamation. Federal regulations and safe handling.' },
              { title: 'Installation & Service', desc: 'Equipment sizing, ductwork, brazing, system startup, and preventive maintenance with real equipment.' },
              { title: 'Troubleshooting', desc: 'Systematic diagnosis of heating and cooling failures. Use gauges, meters, and diagnostic tools to isolate problems.' },
              { title: 'Safety & Compliance', desc: 'OSHA 30 certification, lockout/tagout, fall protection, confined spaces, and job site safety protocols.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">6 Industry Credentials Included</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">Graduate with every certification HVAC employers require.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {credentials.map((cred) => (
              <div key={cred.name} className={`rounded-xl p-5 border ${cred.required ? 'border-brand-blue-200 bg-brand-blue-50/40' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start gap-3">
                  <Award className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cred.required ? 'text-brand-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cred.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{cred.issuer}</p>
                    {cred.required && <span className="inline-block mt-2 text-xs font-medium text-brand-blue-700 bg-brand-blue-100 px-2 py-0.5 rounded">Required by federal law</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Program Structure</h2>
          <p className="text-gray-600 mb-8">15 weeks of training split between classroom theory and employer-site OJT.</p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { num: '110', label: 'Hours Classroom', sub: 'Theory, labs, exam prep' },
              { num: '50', label: 'Hours OJT', sub: 'On-the-job training at employer sites' },
              { num: '160', label: 'Total Clock Hours', sub: 'Theory + OJT combined' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <p className="text-3xl font-bold text-gray-900">{s.num}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                <p className="text-xs text-gray-400 mt-2">{s.sub}</p>
              </div>
            ))}
          </div>

          {modules.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Curriculum Modules</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod, i) => (
                  <div key={mod.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{mod.title}</p>
                        {mod.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mod.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="bg-brand-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
          <p className="text-brand-blue-100 mb-6">Tuition may be fully covered through workforce funding. Self-pay options start at $1,750 down.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/student?program=hvac-technician" className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 transition">
              Apply with Workforce Funding
            </Link>
            <Link href="/programs/hvac-technician/apply" className="inline-flex items-center justify-center px-6 py-3 border-2 border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition">
              Enroll &amp; Pay Tuition
            </Link>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Career Outcomes</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">HVAC is a 4-star Indiana Top Job. Demand is year-round. Experienced technicians earn $60K–$80K+.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'HVAC Service Technician', salary: '$38K–$46K', image: '/images/trades/program-hvac-technician.jpg' },
              { title: 'Installation Specialist', salary: '$40K–$55K', image: '/images/trades/program-hvac-overview.jpg' },
              { title: 'Maintenance Technician', salary: '$42K–$60K', image: '/images/programs-hq/hvac-technician.jpg' },
            ].map((job) => (
              <div key={job.title} className="rounded-xl overflow-hidden border border-gray-200">
                <div className="relative h-48">
                  <Image src={job.image} alt={job.title} fill quality={85} className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Starting salary: {job.salary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Funding Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How Funding Works</h2>
              <p className="text-gray-600 mb-6">Many students have tuition fully covered through WIOA or the Workforce Ready Grant.</p>
              <div className="space-y-4 mb-6">
                {[
                  { step: '1', title: 'Register at indianacareerconnect.com', desc: 'Create your account on the state workforce portal.' },
                  { step: '2', title: 'Visit your local WorkOne office', desc: 'They determine eligibility and issue funding.' },
                  { step: '3', title: 'Apply to our program', desc: 'We coordinate with WorkOne to confirm enrollment and funding.' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-blue-100 text-brand-blue-700 text-sm font-bold flex items-center justify-center">{s.step}</span>
                    <div>
                      <p className="font-medium text-gray-900">{s.title}</p>
                      <p className="text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mb-6">Not using workforce funding? Self-pay: $5,000 with weekly plans, Affirm, and Sezzle.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/apply/student?program=hvac-technician" className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition">
                  Apply with Workforce Funding
                </Link>
                <Link href="/programs/hvac-technician/apply" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition">
                  Enroll &amp; Pay Tuition
                </Link>
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <Image src="/images/hvac/hvac-advisor-meeting.jpg" alt="Student meeting with a funding advisor" fill quality={90} className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Who This Program Is For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, text: 'Career changers looking for stable, high-demand work' },
              { icon: GraduationCap, text: 'Recent graduates who want hands-on training, not more school' },
              { icon: Shield, text: 'Veterans transitioning to civilian careers in the trades' },
              { icon: Calendar, text: 'Working adults who need flexible scheduling' },
            ].map((item) => (
              <div key={item.text} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <item.icon className="w-6 h-6 text-brand-blue-600 mb-3" />
                <p className="text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Start Your HVAC Career</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">15 weeks. 6 credentials. 160 clock hours. Apply today — our team responds within 1 business day.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/apply/student?program=hvac-technician" className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-lg transition text-lg">
              Apply with Workforce Funding
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/programs/hvac-technician/apply" className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 hover:border-gray-500 text-white font-bold rounded-lg transition text-lg">
              Enroll &amp; Pay Tuition
            </Link>
          </div>
          <p className="text-gray-500 text-sm">
            Questions? Call <a href="tel:3173143757" className="text-white underline">317-314-3757</a> or email <a href="mailto:info@elevateforhumanity.org" className="text-white underline">info@elevateforhumanity.org</a>
          </p>
        </div>
      </section>
    </>
  );
}
