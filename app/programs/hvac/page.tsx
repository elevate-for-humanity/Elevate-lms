'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, CheckCircle, ArrowRight, 
  Thermometer, Wind, Wrench, Award, Users, Calendar,
  ChevronDown, ChevronUp, Play, Star, MapPin, Phone,
  GraduationCap, Briefcase, Shield, Zap, Target, Heart
} from 'lucide-react';

export default function HVACProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need any prior experience to enroll?",
      answer: "No prior experience is required! Our HVAC program is designed for complete beginners. We start with the fundamentals and progressively build your skills. Whether you're changing careers or just starting out, we'll give you everything you need to succeed."
    },
    {
      question: "How long does the program take to complete?",
      answer: "The program runs 12-16 weeks depending on your schedule. We offer flexible morning, afternoon, and evening classes to fit around your life. Most students complete the program while working part-time."
    },
    {
      question: "Is this program really free?",
      answer: "Yes! If you qualify for WIOA (Workforce Innovation and Opportunity Act) funding, your tuition is 100% covered. This includes all materials, tools, certifications, and even job placement assistance. We help you apply for funding as part of the enrollment process."
    },
    {
      question: "What certifications will I earn?",
      answer: "You'll earn EPA Section 608 Certification (required by law to handle refrigerants), OSHA 10 Safety Certification, and our program completion certificate. These are industry-recognized credentials that employers actively seek."
    },
    {
      question: "What kind of jobs can I get after completing the program?",
      answer: "Graduates work as HVAC Technicians, Installation Specialists, Maintenance Technicians, and Service Technicians. Entry-level positions typically start at $18-22/hour, with experienced technicians earning $60,000-$80,000+ annually."
    },
    {
      question: "Do you help with job placement?",
      answer: "Absolutely! We have partnerships with over 50 local HVAC companies actively hiring our graduates. Our career services team helps with resume writing, interview prep, and direct introductions to employers. 85% of our graduates are employed within 30 days."
    },
    {
      question: "What tools and equipment will I need?",
      answer: "All tools and equipment are provided during training. Upon graduation, you'll receive a starter tool kit to begin your career. We also provide uniforms and safety gear during the program."
    },
    {
      question: "Can I work while attending the program?",
      answer: "Yes! Many of our students work part-time while completing the program. We offer flexible scheduling options including evening and weekend classes to accommodate working adults."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "HVAC Fundamentals",
      topics: ["Heating and cooling principles", "System components and terminology", "Safety protocols and OSHA standards", "Basic electrical theory"],
      project: "Identify and diagram a complete HVAC system"
    },
    {
      week: "Weeks 3-4",
      title: "Heating Systems",
      topics: ["Furnace operation and maintenance", "Heat pump technology", "Gas and electric heating", "Combustion analysis"],
      project: "Perform a complete furnace inspection and tune-up"
    },
    {
      week: "Weeks 5-6",
      title: "Cooling Systems",
      topics: ["Air conditioning fundamentals", "Refrigeration cycle", "Compressor and condenser operation", "Evaporator coil maintenance"],
      project: "Diagnose and repair a malfunctioning AC unit"
    },
    {
      week: "Weeks 7-8",
      title: "Refrigerant Handling",
      topics: ["EPA 608 certification prep", "Refrigerant types and properties", "Recovery and recycling procedures", "Environmental regulations"],
      project: "EPA 608 Certification Exam"
    },
    {
      week: "Weeks 9-10",
      title: "Installation Techniques",
      topics: ["Ductwork design and installation", "Equipment sizing and selection", "Brazing and soldering", "System startup procedures"],
      project: "Complete a mini-split installation"
    },
    {
      week: "Weeks 11-12",
      title: "Troubleshooting & Diagnostics",
      topics: ["Systematic troubleshooting", "Electrical diagnostics", "Reading schematics", "Customer service skills"],
      project: "Diagnose and repair multiple system faults"
    },
    {
      week: "Weeks 13-14",
      title: "Advanced Systems",
      topics: ["Commercial HVAC overview", "Building automation basics", "Energy efficiency upgrades", "Smart thermostat integration"],
      project: "Design an energy-efficient system upgrade"
    },
    {
      week: "Weeks 15-16",
      title: "Career Preparation",
      topics: ["Resume and interview skills", "Industry certifications review", "Job search strategies", "Employer meet-and-greet"],
      project: "Complete job shadowing and secure employment"
    }
  ];

  const successStories = [
    {
      name: "Marcus Johnson",
      role: "HVAC Service Technician",
      company: "Comfort Systems USA",
      quote: "I was working retail making $12/hour with no future. Six months after graduating, I'm earning $52,000 with full benefits. This program changed my life.",
      salary: "$52,000/year",
      timeToJob: "3 weeks"
    },
    {
      name: "Sarah Mitchell",
      role: "Installation Specialist",
      company: "Johnson Controls",
      quote: "As a single mom, I needed a career that could support my family. The flexible schedule let me train while my kids were in school. Now I have a real career.",
      salary: "$48,000/year",
      timeToJob: "2 weeks"
    },
    {
      name: "David Chen",
      role: "Lead Technician",
      company: "Carrier Enterprise",
      quote: "The hands-on training was incredible. I learned more in 16 weeks than I thought possible. The instructors really care about your success.",
      salary: "$58,000/year",
      timeToJob: "1 week"
    }
  ];

  const stats = [
    { value: "95%", label: "Job Placement Rate", icon: Briefcase },
    { value: "$48K", label: "Average Starting Salary", icon: DollarSign },
    { value: "16", label: "Weeks to Career", icon: Calendar },
    { value: "500+", label: "Graduates Employed", icon: Users }
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'HVAC Technician' }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-blue-800 text-white overflow-hidden">
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
                <span className="text-blue-400"> HVAC Technician</span>
              </h1>
              
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Launch your career in one of America's fastest-growing trades. 
                Learn to install, maintain, and repair heating and cooling systems. 
                <strong className="text-white"> 100% free with WIOA funding.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  12-16 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  $0 Tuition (WIOA)
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  $48K+ Avg Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/wioa-eligibility"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30"
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

      {/* Stats Bar */}
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
                <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why HVAC Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Choose HVAC?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Career That's Always in Demand
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every building needs heating and cooling. That means job security, great pay, and opportunities everywhere you go.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Recession-Proof Career",
                description: "HVAC systems need maintenance regardless of the economy. People always need heat in winter and AC in summer."
              },
              {
                icon: TrendingUp,
                title: "Growing Industry",
                description: "The Bureau of Labor Statistics projects 6% job growth through 2032 - faster than average for all occupations."
              },
              {
                icon: DollarSign,
                title: "Excellent Earning Potential",
                description: "Start at $40-50K and grow to $70-80K+ with experience. Many technicians earn over $100K with overtime."
              },
              {
                icon: Zap,
                title: "No College Debt",
                description: "Skip the 4-year degree and student loans. Start earning in months, not years, with zero debt."
              },
              {
                icon: Target,
                title: "Work Independence",
                description: "Many HVAC techs work independently, managing their own schedules and building relationships with customers."
              },
              {
                icon: Heart,
                title: "Help People Daily",
                description: "You'll be the hero who restores comfort to families and businesses. It's rewarding work that matters."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              What You'll Learn
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive 16-Week Curriculum
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From fundamentals to advanced diagnostics, you'll gain the skills employers are looking for.
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
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
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
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-blue-700">Hands-On Project:</span>
                      <span className="text-sm text-blue-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-blue-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Industry Credentials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Certifications You'll Earn
            </h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Graduate with the credentials employers require - all included in your training.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "EPA Section 608",
                description: "Federally required certification to purchase and handle refrigerants. Essential for any HVAC career.",
                icon: Award
              },
              {
                title: "OSHA 10 Safety",
                description: "Occupational safety certification covering hazard recognition and prevention in the workplace.",
                icon: Shield
              },
              {
                title: "Program Certificate",
                description: "Comprehensive completion certificate documenting your 400+ hours of hands-on training.",
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
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                <p className="text-blue-200">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Graduate Success
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Real People, Real Results
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our graduates are building successful careers across Indiana. Here are some of their stories.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{story.name}</h3>
                    <p className="text-sm text-gray-500">{story.role}</p>
                    <p className="text-sm text-blue-600">{story.company}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic mb-6">"{story.quote}"</p>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Salary:</span>
                    <span className="font-semibold text-green-600 ml-1">{story.salary}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Hired in:</span>
                    <span className="font-semibold text-blue-600 ml-1">{story.timeToJob}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our HVAC program.
            </p>
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

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Start Your HVAC Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Take the first step today. Check your eligibility for free WIOA-funded training and join our next class.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Check Eligibility Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-full transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Talk to an Advisor
            </Link>
          </div>
          <p className="mt-8 text-blue-200 text-sm">
            Classes starting soon • Limited seats available • No cost with WIOA funding
          </p>
        </div>
      </section>
    </>
  );
}
