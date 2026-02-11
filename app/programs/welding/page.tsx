'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, CheckCircle, ArrowRight, 
  Flame, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Shield, Factory,
  Wrench, HardHat, Zap, Target
} from 'lucide-react';

export default function WeldingProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need any experience to start welding training?",
      answer: "No prior experience is required. Our program starts with the fundamentals - safety, equipment operation, and basic techniques. We'll teach you everything from striking your first arc to passing AWS certification tests."
    },
    {
      question: "What welding processes will I learn?",
      answer: "You'll master four primary welding processes: SMAW (Stick), GMAW (MIG), GTAW (TIG), and FCAW (Flux-Core). These cover 95% of welding jobs in manufacturing, construction, and fabrication. You'll also learn oxy-fuel cutting and plasma cutting."
    },
    {
      question: "What certifications will I earn?",
      answer: "You'll earn AWS (American Welding Society) certifications in multiple processes and positions. Specific certs include AWS D1.1 Structural Steel, and you'll be prepared for 3G and 4G plate certifications. These are industry-standard credentials recognized by employers nationwide."
    },
    {
      question: "How long is the welding program?",
      answer: "The full program is 12-16 weeks depending on your schedule. We offer day and evening classes. You'll complete approximately 400 hours of hands-on training plus classroom instruction on blueprint reading, welding symbols, and metallurgy."
    },
    {
      question: "Is welding a good career choice?",
      answer: "Absolutely. The Bureau of Labor Statistics projects steady demand for welders through 2032. Skilled welders are needed in manufacturing, construction, shipbuilding, aerospace, and energy. Many welders earn $50,000-$80,000+ annually, with underwater and pipeline welders earning over $100,000."
    },
    {
      question: "What safety equipment is provided?",
      answer: "We provide all safety equipment during training including welding helmets with auto-darkening lenses, leather gloves, welding jackets, safety glasses, and respirators. You'll learn proper PPE usage as part of the curriculum."
    },
    {
      question: "Can I specialize in a specific type of welding?",
      answer: "Yes! After mastering fundamentals, many students focus on TIG welding for precision work, pipe welding for higher pay, or structural welding for construction. We help you identify which specialization matches your career goals."
    },
    {
      question: "What jobs can I get after completing the program?",
      answer: "Graduates work as production welders, fabricators, pipe welders, structural welders, welding inspectors, and maintenance welders. Industries include automotive, aerospace, construction, shipbuilding, manufacturing, and energy. Many employers offer apprenticeships that lead to journeyman status."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Welding Fundamentals & Safety",
      topics: ["Shop safety and PPE requirements", "Welding equipment and setup", "Metal identification and properties", "Oxy-fuel cutting and heating"],
      project: "Complete safety certification and basic cuts"
    },
    {
      week: "Weeks 3-4",
      title: "SMAW (Stick Welding)",
      topics: ["Electrode selection (6010, 6011, 7018)", "Flat and horizontal positions", "Vertical up and overhead positions", "Joint preparation and fit-up"],
      project: "Pass visual inspection on all position welds"
    },
    {
      week: "Weeks 5-6",
      title: "GMAW (MIG Welding)",
      topics: ["Wire feed setup and adjustment", "Shielding gas selection (CO2, Argon mix)", "Short circuit and spray transfer", "Welding thin and thick materials"],
      project: "Complete production-quality MIG welds"
    },
    {
      week: "Weeks 7-8",
      title: "FCAW (Flux-Core Welding)",
      topics: ["Self-shielded vs gas-shielded FCAW", "High-deposition welding techniques", "Out-of-position welding", "Structural welding applications"],
      project: "Pass AWS D1.1 visual inspection"
    },
    {
      week: "Weeks 9-10",
      title: "GTAW (TIG Welding)",
      topics: ["Tungsten selection and preparation", "Filler rod techniques", "Welding steel, stainless, and aluminum", "Precision and aesthetic welds"],
      project: "Complete TIG welds on multiple materials"
    },
    {
      week: "Weeks 11-12",
      title: "Blueprint Reading & Welding Symbols",
      topics: ["Interpreting welding blueprints", "AWS welding symbol standards", "Weld joint design and specifications", "Quality control and inspection"],
      project: "Fabricate project from blueprint"
    },
    {
      week: "Weeks 13-14",
      title: "Certification Preparation",
      topics: ["AWS certification test procedures", "Bend test and visual inspection criteria", "Common defects and how to avoid them", "Test plate preparation"],
      project: "Pass practice certification tests"
    },
    {
      week: "Weeks 15-16",
      title: "Advanced Skills & Career Launch",
      topics: ["Pipe welding introduction", "Plasma and CNC cutting", "Resume and portfolio building", "Employer interviews and job placement"],
      project: "Earn AWS certifications and secure employment"
    }
  ];

  const stats = [
    { value: "92%", label: "Certification Pass Rate", icon: Award },
    { value: "$54K", label: "Average Starting Salary", icon: DollarSign },
    { value: "16", label: "Weeks to Certified", icon: Calendar },
    { value: "400+", label: "Hours Hands-On Training", icon: Flame }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'Welding Technology' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-red-800 text-white overflow-hidden">
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
                Become a Certified
                <span className="text-red-400"> Welder</span>
              </h1>
              
              <p className="text-xl text-red-100 mb-8 leading-relaxed">
                Master the art and science of welding. Learn MIG, TIG, Stick, and Flux-Core welding from industry professionals. 
                Earn AWS certifications and join a trade with <strong className="text-white">unlimited earning potential.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-red-400" />
                  12-16 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  $0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  $54K+ Starting Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/apply?program=welding"
                  className="inline-flex items-center justify-center px-8 py-4 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
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
                <stat.icon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Welding */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Welding?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Skill That's Always in Demand
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From skyscrapers to spacecraft, welders build the world. It's a career that combines craftsmanship with technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Factory,
                title: "Diverse Industries",
                description: "Work in manufacturing, construction, aerospace, automotive, shipbuilding, energy, or art. Welders are needed everywhere metal is joined."
              },
              {
                icon: DollarSign,
                title: "High Earning Potential",
                description: "Entry-level welders start at $40-55K. Specialized welders (pipe, underwater, aerospace) earn $80-150K+. Overtime is often available."
              },
              {
                icon: Target,
                title: "Career Advancement",
                description: "Progress from welder to lead welder, welding inspector, welding engineer, or shop supervisor. Many welders start their own fabrication businesses."
              },
              {
                icon: Wrench,
                title: "Hands-On Work",
                description: "If you like working with your hands and seeing tangible results, welding delivers. Every project is a visible accomplishment."
              },
              {
                icon: HardHat,
                title: "Job Security",
                description: "Automation can't replace skilled welders for complex work. The aging workforce means opportunities for new welders are growing."
              },
              {
                icon: Zap,
                title: "Portable Skills",
                description: "Your certifications are recognized nationwide. Work anywhere - from local shops to traveling pipeline jobs to international projects."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-red-600" />
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
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Training Program
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              16-Week Welding Curriculum
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              400+ hours of hands-on training across all major welding processes. Graduate with AWS certifications.
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
                    <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-red-700">Milestone:</span>
                      <span className="text-sm text-red-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-red-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Industry Credentials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AWS Certifications Included
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Graduate with American Welding Society certifications recognized by employers worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AWS D1.1 Structural",
                description: "Certification for structural steel welding used in buildings, bridges, and heavy equipment.",
                icon: Award
              },
              {
                title: "Multi-Process Certified",
                description: "Demonstrate proficiency in SMAW, GMAW, GTAW, and FCAW welding processes.",
                icon: Flame
              },
              {
                title: "Multi-Position Qualified",
                description: "Certified to weld in flat, horizontal, vertical, and overhead positions (1G-4G).",
                icon: GraduationCap
              }
            ].map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center"
              >
                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                <p className="text-slate-300">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
      <section className="py-20 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Strike Your First Arc?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join a trade that builds the world. Check your eligibility for free WIOA-funded welding training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=welding"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-red-600 font-semibold rounded-full hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Check Eligibility Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/inquiry?program=welding"
              className="inline-flex items-center justify-center px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-full transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
