'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
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
      answer: "The program runs 12 weeks with 144 total instructional hours. It combines evening classroom instruction, self-paced LMS coursework, and employer site visits. Cohort-based scheduling with evening and adult-friendly options available. Most students complete the program while working."
    },
    {
      question: "Is this program free?",
      answer: "Yes — for those who qualify. If you are eligible for WIOA (Workforce Innovation and Opportunity Act) or other workforce development funding, your tuition is fully covered. If you do not qualify for funded training, self-pay options are available. Contact us to find out which option fits your situation."
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
      answer: "Yes. Our career services team helps with resume writing, interview prep, and employer introductions. During the program, you'll visit employer job sites and meet hiring managers through structured employer site days. We also provide apprenticeship application guidance and referral support to union and non-union sponsors in the Indianapolis area."
    },
    {
      question: "What tools and equipment will I need?",
      answer: "PPE (safety glasses, hard hat, gloves) is provided for employer site days and you keep it at completion. This is a theory + certification prep program — you won't need personal tools during training. We provide a recommended tool list for when you start your apprenticeship or first job."
    },
    {
      question: "Can I work while attending the program?",
      answer: "Yes! Many of our students work part-time while completing the program. We offer flexible scheduling options including evening and weekend classes to accommodate working adults."
    }
  ];

  const learningOutcomes = [
    "Heating and cooling system fundamentals, components, and safety",
    "EPA 608 certification exam preparation (refrigerant handling)",
    "Electrical theory for HVAC systems",
    "Installation, maintenance, and troubleshooting techniques",
    "Employer site day exposure at HVAC contractor job sites",
    "Apprenticeship application portfolio and career readiness",
  ];

  const careerOutcomes = [
    {
      role: "HVAC Service Technician",
      sector: "Residential & commercial service companies",
      salaryRange: "$40,000–$55,000/year",
      outlook: "High demand year-round"
    },
    {
      role: "Installation Specialist",
      sector: "Mechanical contractors & builders",
      salaryRange: "$42,000–$58,000/year",
      outlook: "Strong growth in new construction"
    },
    {
      role: "Refrigeration Technician",
      sector: "Industrial & commercial facilities",
      salaryRange: "$50,000–$70,000/year",
      outlook: "Specialized, premium pay"
    }
  ];

  const stats = [
    { value: "4★", label: "Indiana Top Jobs Rating", icon: Briefcase },
    { value: "$48K", label: "Average Starting Salary", icon: DollarSign },
    { value: "12", label: "Weeks to Career", icon: Calendar },
    { value: "144", label: "Instructional Hours", icon: Users }
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
      <section className="relative bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-slate-900 text-white overflow-hidden">
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
                HVAC Fundamentals
                <span className="text-brand-blue-400"> Career Pathway</span>
              </h1>
              
              <p className="text-xl text-brand-blue-100 mb-8 leading-relaxed">
                Start your path into HVAC with EPA 608 exam prep, employer site days, and apprenticeship readiness. 
                <strong className="text-white">Funding may be available for eligible WIOA participants.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-brand-blue-400" />
                  12 Weeks • 144 Hours
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Calendar className="w-4 h-4 text-brand-blue-400" />
                  Evening & Adult-Friendly
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 backdrop-blur rounded-full text-sm font-semibold">
                  <TrendingUp className="w-4 h-4 text-yellow-400" />
                  4-Star Indiana Top Jobs
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-brand-green-400" />
                  Funding Available (WIOA)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/wioa-eligibility"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-500 hover:bg-brand-blue-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-brand-blue-500/30"
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
                <stat.icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
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
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
              <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">72</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classroom Hours (RTI)</div>
              <p className="text-gray-600 text-sm">Evening classroom instruction covering HVAC theory, electrical fundamentals, refrigeration principles, and EPA 608 exam preparation.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Employer Site Days (OJT Exposure)</div>
              <p className="text-gray-600 text-sm">6 supervised visits to HVAC contractor job sites. Observe installations, service calls, and equipment. Meet hiring managers. All hours documented.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">LMS Coursework</div>
              <p className="text-gray-600 text-sm">Self-paced online modules with progress tracking, quizzes, and bi-weekly reporting dashboards. Complete on your own schedule.</p>
            </div>
          </div>

          {/* Program Details Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Employer Site Days</h3>
              <p className="text-gray-600 mb-3">Structured visits to HVAC contractor job sites. Observe residential and commercial work, meet hiring managers, and build employer connections.</p>
              <p className="text-sm text-brand-blue-600 font-semibold">All site day hours documented for apprenticeship application portfolios.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Cohort Scheduling</h3>
              <p className="text-gray-600 mb-3">Cohort-based scheduling with evening and adult-friendly options available. Final schedule customized per partner cohort.</p>
              <p className="text-sm text-gray-500"><strong>Format:</strong> 12 weeks, 144 total instructional hours</p>
              <p className="text-sm text-gray-500"><strong>Cohort size:</strong> 8–20 participants</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-blue-600" />
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

      {/* Why HVAC Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-brand-blue-600" />
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
                  <GraduationCap className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
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

      {/* Certifications */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-brand-blue-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Industry Credentials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Certifications You'll Earn
            </h2>
            <p className="text-lg text-brand-blue-200 max-w-2xl mx-auto">
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
                description: "Program completion certificate documenting your 144 hours of instruction, employer site days, and exam preparation.",
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
                <div className="w-16 h-16 bg-brand-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                <p className="text-brand-blue-200">{cert.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Career Outcomes
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Where This Pathway Leads
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              HVAC is a 4-star Indiana Top Jobs occupation. These are typical entry-level positions available to program completers with EPA 608 certification.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {careerOutcomes.map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl p-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-brand-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{outcome.role}</h3>
                    <p className="text-sm text-gray-500">{outcome.sector}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Salary Range:</span>
                    <span className="font-semibold text-brand-green-600">{outcome.salaryRange}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Outlook:</span>
                    <span className="font-semibold text-brand-blue-600">{outcome.outlook}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            Salary data based on Bureau of Labor Statistics and Indiana DWD for the Indianapolis metro area.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
      <section className="py-20 bg-gradient-to-br from-brand-blue-600 to-brand-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Start Your HVAC Career?
          </h2>
          <p className="text-xl text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Take the first step today. Check your eligibility for WIOA-funded training and apply for our next cohort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-semibold rounded-full hover:bg-brand-blue-50 transition-all transform hover:scale-105 shadow-lg"
            >
              Check Eligibility Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-700 hover:bg-brand-blue-600 text-white font-semibold rounded-full transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Talk to an Advisor
            </Link>
          </div>
          <p className="mt-8 text-brand-blue-200 text-sm">
            Classes starting soon • Limited seats available • Free for those who qualify • Self-pay options available
          </p>
        </div>
      </section>
    </>
  );
}
