'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
  Zap, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Shield, Building,
  Lightbulb, Gauge, Home, Factory
} from 'lucide-react';

export default function ElectricalProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need experience to become an electrician?",
      answer: "No prior experience is needed. Our program teaches you from the ground up — starting with basic electrical theory, safety, and the National Electrical Code. You'll progress through wiring principles, troubleshooting methodology, and employer site visits where you observe real installations."
    },
    {
      question: "What's the difference between residential and commercial electrical work?",
      answer: "Residential work focuses on homes - 120/240V systems, outlets, lighting, and panels. Commercial work involves larger 277/480V systems, three-phase power, motor controls, and complex distribution. Our program covers both so you can work in either field."
    },
    {
      question: "What career path does this program prepare me for?",
      answer: "This program prepares you for entry-level electrical helper and apprentice positions. Indiana requires 8,000 hours (about 4 years) of supervised work experience plus passing the journeyman exam. Our program gives you the foundation and employer connections to start that apprenticeship. Many employers sponsor apprentices and pay for continued education."
    },
    {
      question: "What credentials will I earn?",
      answer: "You'll complete OSHA 10 Safety training (via CareerSafe) and receive a program completion credential documenting your instructional hours and competencies. You'll also be prepared to register as an Indiana Electrical Apprentice and begin your career pathway."
    },
    {
      question: "Is electrical work dangerous?",
      answer: "Electricity demands respect, but proper training makes it safe. We emphasize safety from day one - lockout/tagout procedures, PPE, testing equipment, and the NEC safety requirements. Professional electricians have excellent safety records because they follow protocols."
    },
    {
      question: "What tools will I need?",
      answer: "Basic hand tools are provided during training. As you progress in your career, you'll build your own tool collection. Essential tools include multimeters, wire strippers, lineman's pliers, screwdrivers, and fish tape. Most apprentices invest $500-1,000 in quality tools."
    },
    {
      question: "Can electricians work for themselves?",
      answer: "Yes! After becoming a licensed journeyman or master electrician, many start their own contracting businesses. Residential service work is especially suited for self-employment. You'll need a contractor's license and insurance, but the earning potential is significant."
    },
    {
      question: "What's the job outlook for electricians?",
      answer: "Excellent. The Bureau of Labor Statistics projects 6% growth through 2032. Electric vehicle charging infrastructure, solar installations, smart home technology, and aging electrical systems all drive demand. Skilled electricians are consistently in short supply."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Electrical Fundamentals",
      topics: ["Electrical theory (voltage, current, resistance)", "Ohm's Law and power calculations", "AC vs DC electricity", "Electrical safety and OSHA requirements"],
      project: "Build and test basic circuits"
    },
    {
      week: "Weeks 3-4",
      title: "National Electrical Code (NEC)",
      topics: ["NEC structure and how to use it", "Wiring methods and materials", "Box fill calculations", "Conductor sizing and ampacity"],
      project: "Complete NEC code lookup exercises"
    },
    {
      week: "Weeks 5-6",
      title: "Residential Wiring",
      topics: ["Service entrance and panels", "Branch circuit installation", "Outlet and switch wiring", "GFCI and AFCI protection"],
      project: "Wire a complete room with outlets, switches, and lights"
    },
    {
      week: "Weeks 7-8",
      title: "Lighting Systems",
      topics: ["Lighting circuit design", "Three-way and four-way switches", "Dimmer installation", "LED and fluorescent systems"],
      project: "Install multi-location lighting control"
    },
    {
      week: "Weeks 9-10",
      title: "Commercial Electrical",
      topics: ["Three-phase power systems", "Commercial panel boards", "Conduit bending and installation", "Motor circuits and controls"],
      project: "Install conduit run with proper bends"
    },
    {
      week: "Weeks 11-12",
      title: "Troubleshooting & Career Readiness",
      topics: ["Multimeter and megger usage", "Systematic troubleshooting", "Circuit tracing techniques", "Apprenticeship requirements", "Resume and interview preparation"],
      project: "Complete apprenticeship application portfolio"
    }
  ];

  const stats = [
    { value: "3★", label: "Indiana Top Jobs Rating", icon: Briefcase },
    { value: "$56K", label: "Average Starting Salary", icon: DollarSign },
    { value: "12", label: "Weeks Training", icon: Calendar },
    { value: "144", label: "Instructional Hours", icon: TrendingUp }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/electrician-trades.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'Electrical Technology' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-yellow-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Electrical Fundamentals
                <span className="text-yellow-300"> Career Pathway</span>
              </h1>
              
              <p className="text-xl text-yellow-100 mb-8 leading-relaxed">
                Build your foundation in the electrical trades. Learn residential and commercial wiring theory, NEC code awareness, safety, and troubleshooting. 
                Begin your path into <strong className="text-white">apprenticeship and entry-level electrical positions.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-yellow-300" />
                  12 Weeks • 144 Hours
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Calendar className="w-4 h-4 text-yellow-300" />
                  Evening & Adult-Friendly
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 backdrop-blur rounded-full text-sm font-semibold">
                  <TrendingUp className="w-4 h-4 text-yellow-300" />
                  3-Star Indiana Top Jobs
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-brand-green-400" />
                  Funding Available (WIOA)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply?program=electrical"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white0 hover:bg-yellow-400 text-slate-900 font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/30"
                >
                  Check Your Eligibility
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="#curriculum"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-full transition-all"
                >
                  <Play className="w-5 h-5 mr-2" />
                  View Curriculum
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
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
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">72</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classroom Hours (RTI)</div>
              <p className="text-gray-600 text-sm">Evening classroom instruction covering electrical theory, NEC code, wiring principles, safety protocols, and troubleshooting methodology.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Employer Site Days (OJT Exposure)</div>
              <p className="text-gray-600 text-sm">6 supervised visits to electrical contractor job sites. Observe residential rough-ins, panel installations, and commercial wiring. Meet hiring managers.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gauge className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">LMS Coursework</div>
              <p className="text-gray-600 text-sm">Self-paced online modules with progress tracking, quizzes, and bi-weekly reporting dashboards. Complete on your own schedule.</p>
            </div>
          </div>

          {/* Program Details Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Employer Site Days</h3>
              <p className="text-gray-600 mb-3">Structured visits to electrical contractor job sites. Observe real installations, meet hiring managers, and build employer connections.</p>
              <p className="text-sm text-brand-blue-600 font-semibold">All site day hours documented for apprenticeship application portfolios.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Cohort Scheduling</h3>
              <p className="text-gray-600 mb-3">Cohort-based scheduling with evening and adult-friendly options available. Final schedule customized per partner cohort.</p>
              <p className="text-sm text-gray-500"><strong>Format:</strong> 12 weeks, 144 total instructional hours</p>
              <p className="text-sm text-gray-500"><strong>Cohort size:</strong> 8–20 participants</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-yellow-600" />
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

      {/* Why Electrical */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Electrical?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Career That Powers Everything
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every building, every device, every system needs electricity. Electricians are essential to modern life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Home,
                title: "Residential Opportunities",
                description: "New home construction, renovations, service upgrades, and repairs. Homeowners always need qualified electricians."
              },
              {
                icon: Building,
                title: "Commercial & Industrial",
                description: "Office buildings, factories, hospitals, and data centers require complex electrical systems and ongoing maintenance."
              },
              {
                icon: Zap,
                title: "Green Energy Growth",
                description: "Solar installations, EV charging stations, and battery storage systems are creating new specializations and higher pay."
              },
              {
                icon: DollarSign,
                title: "Strong Earning Potential",
                description: "Apprentices start at $35-45K. Journeymen earn $55-75K. Master electricians and contractors can exceed $100K."
              },
              {
                icon: Shield,
                title: "Apprenticeship Ready",
                description: "This pathway prepares you to register as an Indiana Electrical Apprentice and begin earning while you learn under licensed electricians."
              },
              {
                icon: Lightbulb,
                title: "Problem-Solving Work",
                description: "Every job is different. You'll use your brain and hands to solve electrical challenges and see immediate results."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Training Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              12-Week Electrical Curriculum
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive training covering NEC code, residential and commercial wiring, and troubleshooting.
            </p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-50 rounded-2xl p-6 lg:p-8"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-white0 rounded-2xl flex items-center justify-center text-slate-900">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0 mt-2" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-yellow-700">Applied Exercise:</span>
                      <span className="text-sm text-yellow-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Path */}
      <section className="py-20 bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-yellow-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Career Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Your Path to Master Electrician
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Training Graduate", salary: "$35-45K", time: "12 weeks", desc: "Complete our program" },
              { title: "Electrical Apprentice", salary: "$40-55K", time: "4 years", desc: "8,000 hours supervised work" },
              { title: "Journeyman Electrician", salary: "$55-75K", time: "Licensed", desc: "Work independently" },
              { title: "Master Electrician", salary: "$75-100K+", time: "2+ years", desc: "Supervise and train others" }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-xl p-6 text-center relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white0" />
                )}
                <div className="text-3xl font-bold text-yellow-400 mb-2">{index + 1}</div>
                <h3 className="font-bold mb-1">{step.title}</h3>
                <p className="text-yellow-300 font-semibold">{step.salary}</p>
                <p className="text-sm text-slate-400">{step.time}</p>
                <p className="text-sm text-slate-300 mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white0 text-slate-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Power Your Future?
          </h2>
          <p className="text-xl text-yellow-900 mb-8 max-w-2xl mx-auto">
            Start your journey to becoming a licensed electrician. Check your eligibility for free WIOA-funded training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=electrical"
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Register at Indiana Career Connect
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/inquiry?program=electrical"
              className="inline-flex items-center justify-center px-8 py-4 bg-yellow-700 hover:bg-yellow-800 text-white font-semibold rounded-full transition-all"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Get Free Info
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
