'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
  Droplets, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Shield, Home,
  Wrench, Building, Flame, PipetteIcon
} from 'lucide-react';

export default function PlumbingProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need experience to start plumbing training?",
      answer: "No prior experience required. We teach everything from basic pipe fitting to complex system installation. You'll learn proper techniques from day one with hands-on practice in our training facility."
    },
    {
      question: "How long does it take to become a licensed plumber?",
      answer: "Our training program is 12-16 weeks. After that, Indiana requires 8,000 hours (about 4 years) of apprenticeship under a licensed plumber before you can take the journeyman exam. Our program prepares you to start that apprenticeship."
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
      question: "What certifications will I earn?",
      answer: "You'll earn OSHA 10 Safety Certification and our program completion certificate. You'll also learn about backflow prevention certification and medical gas certification, which are valuable add-ons for your career."
    },
    {
      question: "How much do plumbers earn?",
      answer: "Apprentice plumbers in Indiana start at $35-45K. Licensed journeymen earn $55-75K. Master plumbers and business owners can earn $80-120K+. Service plumbers often earn extra through overtime and on-call work."
    },
    {
      question: "Can I start my own plumbing business?",
      answer: "Yes! After becoming a licensed master plumber (typically 2+ years after journeyman), you can start your own contracting business. Plumbing businesses have low startup costs compared to other trades and steady demand."
    },
    {
      question: "What tools will I need?",
      answer: "Basic hand tools are provided during training. As an apprentice, you'll build your collection over time. Essential tools include pipe wrenches, tubing cutters, PEX crimpers, and a good set of hand tools. Expect to invest $500-1,500 in quality tools."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Plumbing Fundamentals",
      topics: ["Plumbing codes and regulations", "Water supply and drainage principles", "Pipe materials (copper, PVC, PEX, cast iron)", "Safety and tool identification"],
      project: "Identify and assemble various pipe types"
    },
    {
      week: "Weeks 3-4",
      title: "Water Supply Systems",
      topics: ["Water distribution design", "Copper soldering and brazing", "PEX installation methods", "Pressure testing and leak detection"],
      project: "Install a complete water supply rough-in"
    },
    {
      week: "Weeks 5-6",
      title: "Drain, Waste, and Vent (DWV)",
      topics: ["DWV system design principles", "Proper venting requirements", "PVC and ABS installation", "Slope and grade calculations"],
      project: "Install DWV system for bathroom group"
    },
    {
      week: "Weeks 7-8",
      title: "Fixture Installation",
      topics: ["Toilet installation and repair", "Sink and faucet installation", "Shower and tub installation", "Garbage disposal and dishwasher connections"],
      project: "Complete bathroom fixture installation"
    },
    {
      week: "Weeks 9-10",
      title: "Water Heaters",
      topics: ["Tank water heater installation", "Tankless water heater systems", "Gas and electric connections", "Expansion tanks and safety devices"],
      project: "Install and commission water heater"
    },
    {
      week: "Weeks 11-12",
      title: "Gas Piping",
      topics: ["Natural gas and propane systems", "Gas pipe sizing and materials", "Appliance connections", "Leak testing and safety"],
      project: "Install gas line to appliance"
    },
    {
      week: "Weeks 13-14",
      title: "Service and Repair",
      topics: ["Troubleshooting drain problems", "Leak repair techniques", "Water heater service", "Customer service skills"],
      project: "Diagnose and repair common plumbing issues"
    },
    {
      week: "Weeks 15-16",
      title: "Career Preparation",
      topics: ["Blueprint reading for plumbers", "Estimating and bidding basics", "Apprenticeship requirements", "Job placement assistance"],
      project: "Secure apprenticeship placement"
    }
  ];

  const stats = [
    { value: "91%", label: "Job Placement Rate", icon: Briefcase },
    { value: "$52K", label: "Average Starting Salary", icon: DollarSign },
    { value: "16", label: "Weeks Training", icon: Calendar },
    { value: "5%", label: "Job Growth Rate", icon: TrendingUp }
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

      {/* Hero */}
      <section className="relative bg-cyan-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Become a Licensed
                <span className="text-cyan-300"> Plumber</span>
              </h1>
              
              <p className="text-xl text-cyan-100 mb-8 leading-relaxed">
                Master the essential trade that keeps water flowing and buildings functioning. 
                Learn installation, repair, and service skills for a <strong className="text-white">recession-proof career.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-cyan-300" />12-16 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />$0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-cyan-300" />$52K+ Starting Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply?program=plumbing" className="inline-flex items-center justify-center px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30">
                  Check Your Eligibility<ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link href="#curriculum" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-full transition-all">
                  <Play className="w-5 h-5 mr-2" />View Curriculum
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
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-center">
                <stat.icon className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
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

      {/* Curriculum */}
      <section id="curriculum" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Training Program</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">16-Week Plumbing Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Comprehensive hands-on training in water supply, drainage, fixtures, and gas piping.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-cyan-600 rounded-2xl flex items-center justify-center text-white">
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
                    <div className="bg-cyan-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-cyan-700">Hands-On Project:</span>
                      <span className="text-sm text-cyan-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
