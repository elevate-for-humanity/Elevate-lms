'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
  Droplets, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Shield, Home,
  Wrench, Building, Flame, PipetteIcon
} from 'lucide-react';

export default function PlumbingProgramPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need experience to start plumbing training?",
      answer: "No prior experience required. We teach everything from plumbing fundamentals to system design principles. You'll learn through classroom instruction, LMS coursework, and employer site visits where you observe real installations and meet hiring managers."
    },
    {
      question: "How long is the program and what comes after?",
      answer: "Our career pathway program is 12 weeks (144 total instructional hours). It combines evening classroom instruction, self-paced LMS coursework, and employer site visits. Cohort-based scheduling with evening and adult-friendly options available. After completing the program, you'll be prepared for entry-level plumbing helper positions and apprenticeship registration. Indiana requires apprenticeship hours under a licensed plumber before you can take the journeyman exam — our program gives you the foundation and employer connections to start that path."
    },
    {
      question: "What's the difference between residential and commercial plumbing?",
      answer: "Residential plumbing focuses on homes - water heaters, fixtures, drain lines, and small pipe sizes. Commercial plumbing involves larger buildings with complex systems, bigger pipes, and specialized equipment like grease traps and backflow preventers."
    },
    {
      question: "Is plumbing physically demanding?",
      answer: "Yes, plumbing requires physical fitness. You'll lift heavy materials, work in tight spaces, and spend time on your feet. However, proper techniques and tools minimize strain. Many plumbers work well into their 60s."
    },
    {
      question: "What credentials will I earn?",
      answer: "You'll complete OSHA 10 Safety training (via CareerSafe) and receive a program completion credential documenting your instructional hours and competencies. You'll also learn about backflow prevention and medical gas — valuable specializations as you advance in your career."
    },
    {
      question: "How much do plumbers earn?",
      answer: "Apprentice plumbers in Indiana start at $35-45K. Licensed journeymen earn $55-75K. Master plumbers and business owners can earn $80-120K+. Service plumbers often earn extra through overtime and on-call work."
    },
    {
      question: "Can I start my own plumbing business?",
      answer: "Yes — long-term. After completing your apprenticeship and earning your journeyman license, you can pursue a master plumber license and start your own contracting business. This pathway program is your first step toward that goal."
    },
    {
      question: "What tools will I need?",
      answer: "Basic hand tools are provided during training. As an apprentice, you'll build your collection over time. Essential tools include pipe wrenches, tubing cutters, PEX crimpers, and a good set of hand tools. Expect to invest $500-1,500 in quality tools."
    }
  ];

  const learningOutcomes = [
    "Plumbing codes, regulations, and Indiana Plumbing Code compliance",
    "Water supply systems, pipe materials, and installation methods",
    "Drain, waste, and vent (DWV) system principles",
    "Fixture installation and water heater fundamentals",
    "Employer site day exposure at plumbing contractor job sites",
    "Apprenticeship application portfolio and career readiness",
  ];

  const stats = [
    { value: "High", label: "Indiana Demand Rating", icon: Briefcase },
    { value: "$52K", label: "Average Starting Salary", icon: DollarSign },
    { value: "12", label: "Weeks Training", icon: Calendar },
    { value: "144", label: "Instructional Hours", icon: TrendingUp }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'Plumbing Technology' }
          ]} />
        </div>
      </div>

      <ProgramHeroBanner videoSrc="/videos/electrician-trades.mp4" voiceoverSrc="/audio/heroes/skilled-trades.mp3" />

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-center">
                <stat.icon className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Overview + Delivery Model */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-cyan-100 text-cyan-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Program Structure
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Delivery Model: Classroom + LMS + Employer Site Days
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A hybrid workforce pathway combining evening classroom instruction, self-paced LMS coursework, and supervised employer site days with OJT exposure.
            </p>
          </div>

          {/* Hours Breakdown */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">72</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classroom Hours (RTI)</div>
              <p className="text-gray-600 text-sm">Evening classroom instruction covering plumbing fundamentals, water supply systems, drainage, fixture installation, and code compliance.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Employer Site Days (OJT Exposure)</div>
              <p className="text-gray-600 text-sm">6 supervised visits to plumbing contractor job sites. Observe residential and commercial installations, service calls, and new construction. Meet hiring managers.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">LMS Coursework</div>
              <p className="text-gray-600 text-sm">Self-paced online modules with progress tracking, quizzes, and bi-weekly reporting dashboards. Complete on your own schedule.</p>
            </div>
          </div>

          {/* Program Details Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Employer Site Days</h3>
              <p className="text-gray-600 mb-3">Structured visits to plumbing contractor job sites. Observe real installations, meet hiring managers, and build employer connections.</p>
              <p className="text-sm text-cyan-600 font-semibold">All site day hours documented for apprenticeship application portfolios.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Cohort Scheduling</h3>
              <p className="text-gray-600 mb-3">Cohort-based scheduling with evening and adult-friendly options available. Final schedule customized per partner cohort.</p>
              <p className="text-sm text-gray-500"><strong>Format:</strong> 12 weeks, 144 total instructional hours</p>
              <p className="text-sm text-gray-500"><strong>Cohort size:</strong> 8–20 participants</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Bilingual Support</h3>
              <p className="text-gray-600 mb-3">Bilingual (English/Spanish) instructional assistants available for cohort groups. Written materials available in Spanish upon request.</p>
              <p className="text-sm text-gray-500"><strong>Admission:</strong> 18+, valid ID, no experience required</p>
            </div>
          </div>

          {/* Funding */}
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm text-center">
            <h3 className="text-xl font-bold mb-3">Funding Options</h3>
            <p className="text-gray-600 mb-4">Workforce-funded cohorts, employer-sponsored training, grant-funded programs, and custom organizational cohorts supported.</p>
            <p className="text-sm text-gray-500">Cohort-based and workforce-funded pricing available. Custom pricing provided per partner cohort and program scope.</p>
          </div>
        </div>
      </section>

      {/* Why Plumbing */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-cyan-100 text-cyan-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why Plumbing?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Essential Work That Never Stops</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Every building needs plumbing. From new construction to emergency repairs, plumbers are always in demand.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Home, title: "Residential Demand", description: "New homes, remodels, and repairs keep residential plumbers busy year-round. Service calls often pay premium rates." },
              { icon: Building, title: "Commercial Growth", description: "Office buildings, restaurants, hospitals, and schools all need plumbing installation and maintenance." },
              { icon: Shield, title: "Recession-Proof", description: "Plumbing emergencies don't wait for good economic times. Pipes burst, drains clog, and water heaters fail regardless of the economy." },
              { icon: DollarSign, title: "Strong Earnings", description: "Licensed plumbers earn $55-75K. Master plumbers and business owners often exceed $100K. Overtime is frequently available." },
              { icon: Wrench, title: "Variety of Work", description: "No two days are the same. New construction, service calls, remodels, and specialty work keep the job interesting." },
              { icon: Flame, title: "Growing Specialties", description: "Water treatment, medical gas, fire suppression, and green plumbing offer paths to higher pay and specialized work." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section id="curriculum" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              What You&apos;ll Learn
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Program Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              12 weeks. 144 instructional hours. Theory + employer site days + LMS coursework.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 lg:p-10">
            <div className="grid md:grid-cols-2 gap-4">
              {learningOutcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{outcome}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-6 text-center">
              Detailed curriculum provided upon enrollment. Program content may be customized per cohort.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Common Questions</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === index && <div className="px-6 pb-5"><p className="text-gray-600 leading-relaxed">{faq.answer}</p></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Your Plumbing Career?</h2>
          <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">Join a trade that's always in demand. Check your eligibility for free WIOA-funded training.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=plumbing" className="inline-flex items-center justify-center px-8 py-4 bg-white text-cyan-600 font-semibold rounded-full hover:bg-cyan-50 transition-all transform hover:scale-105 shadow-lg">
              Register at Indiana Career Connect<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/inquiry?program=plumbing" className="inline-flex items-center justify-center px-8 py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold rounded-full transition-all">
              <ArrowRight className="w-5 h-5 mr-2" />Get Free Info
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
