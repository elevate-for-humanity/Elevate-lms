'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, Circle, ArrowRight, 
  Truck, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Shield, MapPin,
  FileCheck, AlertTriangle, Fuel, Route
} from 'lucide-react';

export default function CDLProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What are the requirements to get a CDL?",
      answer: "You must be at least 18 years old for intrastate (within Indiana) or 21 for interstate driving. You need a valid driver's license, pass a DOT physical exam, have no DUI/DWI convictions in the past 10 years, and pass written knowledge tests and a skills test. We help you through every step."
    },
    {
      question: "How long does it take to get my CDL?",
      answer: "Our program is 4-6 weeks for Class A CDL. This includes classroom instruction, behind-the-wheel training, and preparation for your BMV skills test. Some students complete faster depending on prior experience and scheduling."
    },
    {
      question: "What's the difference between Class A and Class B CDL?",
      answer: "Class A allows you to drive any combination of vehicles with a gross combination weight rating (GCWR) of 26,001 lbs or more, including tractor-trailers. Class B covers single vehicles over 26,001 lbs like buses and dump trucks. Class A opens more job opportunities and higher pay."
    },
    {
      question: "Is the training paid for through WIOA?",
      answer: "Yes! If you qualify for WIOA funding, your entire CDL training can be covered at no cost to you. This includes tuition, DOT physical, drug screening, permit fees, and even the BMV skills test fee. We help you apply during enrollment."
    },
    {
      question: "What endorsements can I add to my CDL?",
      answer: "We prepare you for Hazmat (H), Tanker (N), Doubles/Triples (T), and Passenger (P) endorsements. Hazmat requires an additional TSA background check. More endorsements mean more job opportunities and higher pay."
    },
    {
      question: "Do I need to pass a drug test?",
      answer: "Yes, DOT requires pre-employment drug screening and you'll be subject to random testing throughout your career. We include your initial drug screening in the program. The trucking industry has zero tolerance for substance use."
    },
    {
      question: "What kind of trucks will I train on?",
      answer: "You'll train on modern automatic and manual transmission trucks. We use day cabs and sleeper cabs so you're prepared for any equipment. Our fleet includes Freightliner, Peterbilt, and Kenworth trucks commonly used by employers."
    },
    {
      question: "How much can I earn as a CDL driver?",
      answer: "Entry-level CDL-A drivers in Indiana typically start at $45,000-$55,000 annually. With 1-2 years experience, earnings increase to $60,000-$75,000. Owner-operators and specialized haulers can earn $100,000+. Many companies offer sign-on bonuses of $5,000-$15,000."
    }
  ];

  const curriculum = [
    {
      week: "Week 1",
      title: "CDL Fundamentals & Permit Prep",
      topics: ["Federal Motor Carrier Safety Regulations (FMCSR)", "Hours of Service (HOS) rules and ELD requirements", "Pre-trip and post-trip inspection procedures", "Air brake systems and components"],
      project: "Pass CDL permit written exams (General Knowledge, Air Brakes, Combination)"
    },
    {
      week: "Week 2",
      title: "Vehicle Systems & Safety",
      topics: ["Coupling and uncoupling procedures", "Cargo securement and weight distribution", "Hazardous materials awareness", "Accident procedures and reporting"],
      project: "Complete full 117-point pre-trip inspection from memory"
    },
    {
      week: "Week 3",
      title: "Basic Vehicle Control",
      topics: ["Straight line backing", "Offset backing (left and right)", "Alley dock backing (90-degree)", "Parallel parking (sight-side and blind-side)"],
      project: "Pass all backing maneuvers within BMV standards"
    },
    {
      week: "Week 4",
      title: "Road Training Fundamentals",
      topics: ["Shifting patterns (9, 10, 13, 18 speed)", "Mountain driving and grade descent", "Urban driving and tight maneuvering", "Highway merging and lane changes"],
      project: "Complete 20+ hours of supervised road driving"
    },
    {
      week: "Week 5",
      title: "Advanced Road Skills",
      topics: ["Night driving techniques", "Adverse weather operation", "Fuel-efficient driving practices", "Trip planning and route navigation"],
      project: "Complete a 200+ mile training route"
    },
    {
      week: "Week 6",
      title: "Testing & Career Launch",
      topics: ["BMV skills test preparation", "Mock DOT inspections", "Job application and interview prep", "Employer orientation requirements"],
      project: "Pass Indiana BMV CDL Skills Test"
    }
  ];

  const stats = [
    { value: "94%", label: "First-Time Pass Rate", icon: Award },
    { value: "$52K", label: "Average Starting Salary", icon: DollarSign },
    { value: "6", label: "Weeks to Licensed", icon: Calendar },
    { value: "50+", label: "Hiring Partners", icon: Briefcase }
  ];

  const employers = [
    "Schneider National", "Werner Enterprises", "Swift Transportation", 
    "J.B. Hunt", "FedEx Freight", "UPS Freight", "XPO Logistics",
    "Old Dominion", "Estes Express", "ABF Freight"
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'CDL Training' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/cdl-vibrant.jpg" alt="CDL Training" className="w-full h-full object-cover" />
          
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Get Your
                <span className="text-brand-orange-400"> Commercial Driver's License</span>
              </h1>
              
              <p className="text-xl text-brand-orange-100 mb-8 leading-relaxed">
                Join one of America's most in-demand professions. Over 80,000 truck driver positions are unfilled nationwide. 
                Get licensed in 6 weeks and start earning <strong className="text-white">$50,000+ your first year.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-brand-orange-400" />
                  4-6 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-brand-green-400" />
                  $0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  $52K+ Starting Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/wioa-eligibility"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-500 hover:bg-brand-orange-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-brand-orange-500/30"
                >
                  Check Your Eligibility
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="#curriculum"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-full transition-all"
                >
                  <Play className="w-5 h-5 mr-2" />
                  View Training Schedule
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
                <stat.icon className="w-8 h-8 text-brand-orange-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CDL */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-orange-100 text-brand-orange-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Trucking?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              America Runs on Trucks
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              71% of all freight in the U.S. moves by truck. That's over 10 billion tons annually. The industry needs drivers now more than ever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Briefcase,
                title: "Massive Driver Shortage",
                description: "The American Trucking Association reports a shortage of 80,000+ drivers. Companies are offering sign-on bonuses up to $15,000 to attract new drivers."
              },
              {
                icon: DollarSign,
                title: "Competitive Pay & Benefits",
                description: "First-year drivers average $52,000. Experienced drivers earn $70,000-$90,000. Most companies offer health insurance, 401(k), and paid time off."
              },
              {
                icon: Route,
                title: "Choose Your Lifestyle",
                description: "OTR (over-the-road), regional, local, dedicated routes - pick what fits your life. Home daily, weekly, or see the country. You decide."
              },
              {
                icon: Shield,
                title: "Job Security",
                description: "Freight doesn't stop. E-commerce growth means more packages to deliver. Autonomous trucks are decades away from replacing drivers."
              },
              {
                icon: Truck,
                title: "Be Your Own Boss",
                description: "Many drivers become owner-operators, running their own business. Lease-purchase programs let you own your truck with no money down."
              },
              {
                icon: MapPin,
                title: "Work Anywhere",
                description: "Your CDL is valid in all 50 states. Move anywhere and find work immediately. Trucking jobs exist in every city and town in America."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-brand-orange-600" />
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
              6-Week CDL Training Curriculum
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              160+ hours of classroom and behind-the-wheel training. You'll be fully prepared for your BMV skills test.
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
                    <div className="w-20 h-20 bg-brand-orange-600 rounded-2xl flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Circle className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-brand-orange-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-brand-orange-700">Milestone:</span>
                      <span className="text-sm text-brand-orange-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-brand-orange-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Requirements
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              CDL Requirements in Indiana
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Here's what you need to qualify for CDL training and licensing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileCheck, title: "Age 18+ (Intrastate)", desc: "21+ for interstate driving" },
              { icon: Shield, title: "Valid Driver's License", desc: "Current Indiana license required" },
              { icon: AlertTriangle, title: "Clean Driving Record", desc: "No DUI/DWI in past 10 years" },
              { icon: Fuel, title: "DOT Physical", desc: "Medical certification required" }
            ].map((req, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-xl p-6 text-center"
              >
                <req.icon className="w-10 h-10 text-brand-orange-400 mx-auto mb-3" />
                <h3 className="font-bold mb-1">{req.title}</h3>
                <p className="text-sm text-slate-300">{req.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hiring Partners */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Career Placement
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Hiring Partners
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We work directly with top trucking companies who are actively hiring our graduates.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {employers.map((employer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-3 bg-slate-100 rounded-full text-gray-700 font-medium"
              >
                {employer}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
      <section className="py-20 bg-gradient-to-br from-brand-orange-600 to-brand-orange-800 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Hit the Road?
          </h2>
          <p className="text-xl text-brand-orange-100 mb-8 max-w-2xl mx-auto">
            Start your trucking career in just 6 weeks. Check your eligibility for free WIOA-funded training today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange-600 font-semibold rounded-full hover:bg-brand-orange-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Check Eligibility Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange-700 hover:bg-brand-orange-600 text-white font-semibold rounded-full transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call (317) 555-0123
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
