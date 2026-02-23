'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import {
  Clock, DollarSign, TrendingUp, ArrowRight,
  Award, Calendar, ChevronDown, ChevronUp,
  GraduationCap, Briefcase, Shield, CheckCircle
} from 'lucide-react';

export default function HVACProgramContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need any experience to enroll?",
      answer: "No. This program is built for complete beginners. We start with the basics — what heating and cooling systems are, how they work, and how to work on them safely. You don't need tools, prior training, or a technical background."
    },
    {
      question: "How long is the program?",
      answer: "400 hours total. That includes classroom instruction, self-paced online coursework, and hands-on lab time working with real HVAC equipment. Flexible scheduling is available — day and evening options."
    },
    {
      question: "How much does this program cost?",
      answer: "If you are referred through WorkOne and qualify for WIOA or Workforce Ready Grant funding, your tuition may be fully covered. Start at indianacareerconnect.com to register, then visit your local WorkOne office — they determine eligibility and issue the funding. If you are not using workforce funding, self-pay tuition is $5,000 with weekly payment plans available."
    },
    {
      question: "What certifications do I get?",
      answer: "You'll earn your EPA 608 Certification (required by federal law to purchase and handle all refrigerant types — the highest level covering all four categories), OSHA 30 Safety Certification, and a program completion certificate. The EPA 608 is what employers require."
    },
    {
      question: "What jobs can I get after this?",
      answer: "HVAC Service Technician, Installation Specialist, Maintenance Technician, or Refrigeration Technician. Starting pay is typically $18–22/hour ($38K–$46K/year). Experienced technicians earn $60K–$80K+. HVAC is rated a 4-star Indiana Top Job — demand is high year-round."
    },
    {
      question: "Can I work while in the program?",
      answer: "Yes. Flexible scheduling is available with day and evening options, and the online coursework is self-paced, so most students keep their current job while training. The program is designed for working adults."
    },
    {
      question: "What happens after I graduate?",
      answer: "You'll have your EPA 608 and OSHA 30 certifications, a portfolio of documented job site hours, and connections to local HVAC employers. Our career services team helps with resume writing, interview prep, and direct introductions to hiring managers. Many graduates start working within weeks of completing the program."
    }
  ];

  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'Building Technician with HVAC Fundamentals' }
          ]} />
        </div>
      </div>

      <ProgramHeroBanner videoSrc="/videos/hvac-hero-final.mp4" voiceoverSrc="/audio/heroes/skilled-trades.mp3" />

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/trades/hero-program-hvac.jpg"
          alt="HVAC technician working on a commercial heating and cooling unit"
          fill
          quality={90} className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="max-w-2xl">
            <FundingBadge type="funded" />

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-6 mb-6 leading-tight">
              HVAC Technician Training<br />
              <span className="text-brand-green-300">EPA 608 Certification</span>
            </h1>

            <p className="text-xl text-gray-200 mb-4 leading-relaxed">
              400-hour program covering HVAC fundamentals, refrigerant handling, and hands-on
              employer site experience. Graduate with your EPA 608 Certification,
              OSHA 30, and the credentials employers require.
            </p>

            <p className="text-lg text-brand-green-300 font-semibold mb-8">
              Tuition may be covered through WIOA or Workforce Ready Grant for eligible students referred by WorkOne. Self-pay and payment plans also available.
            </p>

            <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-300">
              <span className="flex items-center gap-2 bg-brand-green-500/20 backdrop-blur px-4 py-2 rounded-full text-brand-green-300 font-semibold border border-brand-green-400/30">
                <Award className="w-4 h-4" /> EPA 608 Certification
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Clock className="w-4 h-4" /> 400 Hours
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" /> Flexible Scheduling
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <TrendingUp className="w-4 h-4" /> 4-Star Indiana Top Job
              </span>
              <span className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <DollarSign className="w-4 h-4" /> $48K Avg Starting Salary
              </span>
            </div>

            <Link
              href="/apply?program=hvac-technician"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-500 text-white font-bold rounded-full transition-all shadow-lg text-lg mb-4"
            >
              Apply
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg px-4 py-3 max-w-xl mb-4">
              <p className="text-sm text-yellow-100 font-semibold">
                Do not proceed with enrollment until you have completed WorkOne verification.{' '}
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-yellow-200">
                  Start at indianacareerconnect.com
                </a>
              </p>
            </div>

            <Link
              href="/programs/hvac-technician/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-full transition-all shadow-lg text-lg"
            >
              Enroll in Program
            </Link>
          </div>
        </div>

      </section>

      {/* What You'll Actually Do — image cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What This Program Looks Like
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three types of learning, designed to fit around your life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-56">
                <Image
                  src="/images/programs-hq/hvac-technician.jpg"
                  alt="Students in an HVAC classroom learning heating and cooling fundamentals"
                  fill
                  quality={90} className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-brand-blue-600 mb-1">72 Hours</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Classroom Instruction</h3>
                <p className="text-gray-600">
                  Instructor-led classes covering HVAC theory, electrical fundamentals,
                  refrigeration, and EPA 608 exam prep. Flexible day and evening options available.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-56">
                <Image
                  src="/images/trades/program-hvac-overview.jpg"
                  alt="Hands-on HVAC lab training with real equipment"
                  fill
                  quality={90} className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-yellow-600 mb-1">292 Hours</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Hands-On Lab</h3>
                <p className="text-gray-600">
                  Work with real HVAC equipment — furnaces, condensers, refrigerant systems,
                  and electrical components. Practice installation, troubleshooting, and repair
                  under instructor supervision.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-56">
                <Image
                  src="/images/programs-hq/technology-hero.jpg"
                  alt="Student completing HVAC coursework online at their own pace"
                  fill
                  quality={90} className="object-cover"
                />
              </div>
              <div className="p-6">
                <div className="text-3xl font-bold text-brand-green-600 mb-1">36 Hours</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Online Coursework</h3>
                <p className="text-gray-600">
                  Self-paced modules with quizzes and progress tracking. Complete on your
                  phone or computer, on your own schedule. Bi-weekly check-ins with your instructor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Enroll — step by step, plain language */}
      <section id="how-to-enroll" className="py-16 bg-slate-50 border-y">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How to Enroll — Step by Step
            </h2>
            <p className="text-lg text-gray-600">
              The whole process takes about 10 minutes. Here&apos;s exactly what happens.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col md:flex-row gap-6 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
                <Image src="/images/programs-hq/training-classroom.jpg" alt="Student meeting with a workforce advisor" fill quality={90} className="object-cover" />
              </div>
              <div className="p-6 flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">1</span>
                  <h3 className="text-xl font-bold text-gray-900">Choose your path</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Using workforce funding (WIOA/WRG)? Start at{' '}
                  <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 font-semibold underline hover:text-brand-blue-800">
                    indianacareerconnect.com
                  </a>{' '}
                  to register with WorkOne — they determine your eligibility and refer you to our program. Self-pay? Skip to step 2.
                </p>
              </div>
            </motion.div>

            {/* Steps 2-4 */}
            {[
              {
                step: 2,
                title: "Apply or enroll",
                description: "Funded students: click \"Apply Now\" and submit a short application. We'll coordinate with WorkOne to confirm your funding. Self-pay students: click \"Enroll & Pay\" to register and choose a payment option.",
                image: "/images/programs-hq/it-support.jpg",
                alt: "Student completing enrollment application"
              },
              {
                step: 3,
                title: "Complete onboarding",
                description: "Upload your photo ID, sign the student agreement, and complete a short orientation. Your account and login credentials are created during this step.",
                image: "/images/programs-hq/business-office.jpg",
                alt: "Student completing onboarding on laptop"
              },
              {
                step: 4,
                title: "Start class",
                description: "Once onboarding and funding are confirmed, you're in. You'll get your class schedule, access to the learning platform, and everything you need to begin training.",
                image: "/images/programs-hq/electrical.jpg",
                alt: "HVAC students in hands-on training lab"
              }
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: item.step * 0.05 }}
                className="flex flex-col md:flex-row gap-6 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
                  <Image src={item.image} alt={item.alt} fill quality={90} className="object-cover" />
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/apply?program=hvac-technician"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-500 text-white font-bold rounded-full transition-all shadow-lg text-lg"
            >
              Apply
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <p className="text-sm text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              Do not proceed with enrollment until you have completed WorkOne verification.
            </p>
            <Link
              href="/programs/hvac-technician/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold rounded-full transition-all shadow-lg text-lg"
            >
              Enroll in Program
            </Link>
          </div>
        </div>
      </section>

      {/* Industry Certification Included */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Industry Certification Included
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              This is not just a class — it is a full certification pathway. You graduate with the credentials HVAC employers require, including proctored exam access through an approved testing partner.
            </p>
          </div>

          {/* EPA 608 — primary certification */}
          <div className="rounded-2xl border-2 border-brand-blue-200 bg-brand-blue-50/30 overflow-hidden mb-8">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative h-64 lg:h-auto">
                <Image src="/images/trades/program-hvac-technician.jpg" alt="EPA Section 608 certification preparation and proctored exam" fill quality={90} className="object-cover" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-6 h-6 text-brand-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">EPA Section 608 Certification</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Required by federal law to purchase and handle refrigerants. Without this certification, you cannot legally work on most HVAC systems.
                </p>
                <p className="text-sm font-semibold text-gray-900 mb-3">What&apos;s included in your training:</p>
                <ul className="space-y-2">
                  {[
                    'Structured 15-week EPA 608 prep curriculum using industry-aligned coursework',
                    'Core refrigerant handling (Weeks 1–7)',
                    'Type I — small appliances (Weeks 8–9)',
                    'Type II — high-pressure systems (Weeks 9–11)',
                    'Type III — low-pressure systems (Weeks 12–14)',
                    'Study kits provided to every student at no cost',
                    'Practice exams and full test bank for exam readiness',
                    'Proctored certification exam access through approved testing partner',
                    'Unlimited online retesting available',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-brand-green-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* OSHA 30 + Program Certificate */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/trades/program-construction-training.jpg" alt="OSHA 30 safety certification training" fill quality={90} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-bold text-gray-900">OSHA 30 Safety</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Occupational safety certification covering hazard recognition, fall protection,
                  electrical safety, and PPE. Most employers require this before your first day on a job site.
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="relative h-48">
                <Image src="/images/trades/program-building-technology.jpg" alt="Program completion certificate and training portfolio" fill quality={90} className="object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-5 h-5 text-brand-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Program Certificate</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Documents your 400 hours of instruction, employer site visits, and exam preparation.
                  Includes your apprenticeship application portfolio with documented OJT hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="py-8 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <p className="font-bold text-lg">Ready to get started?</p>
            <p className="text-yellow-200 text-sm font-semibold">Do not enroll until you have completed WorkOne verification.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/apply?program=hvac-technician" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-full hover:bg-brand-red-50 transition-colors whitespace-nowrap">
              Apply
            </Link>
            <Link href="/programs/hvac-technician/apply" className="bg-brand-green-500 text-white font-bold px-6 py-3 rounded-full hover:bg-brand-green-400 transition-colors whitespace-nowrap">
              Enroll in Program
            </Link>
          </div>
        </div>
      </section>

      {/* EPA 608 — 15-Week Curriculum Schedule */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              EPA 608 Certification — 15-Week Curriculum
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Structured progression from Core fundamentals through all three specialty types, ending with a proctored certification exam administered through an approved testing partner.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { week: 1, title: 'Ozone Depletion & Environmental Regulations', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 2, title: 'Refrigerant Types, Properties & Safety', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 3, title: 'Pressure-Temperature Relationships & the Refrigeration Cycle', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 4, title: 'Recovery, Recycling & Reclamation', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 5, title: 'Leak Detection, Repair & Evacuation', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 6, title: 'Shipping, Labeling & Recordkeeping', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 7, title: 'Core Review & Practice Exam', section: 'Core', color: 'bg-brand-blue-100 text-brand-blue-700' },
              { week: 8, title: 'Small Appliance Systems & Recovery Procedures', section: 'Type I', color: 'bg-emerald-100 text-emerald-700' },
              { week: 9, title: 'Type I Leak Repair & High-Pressure Systems Intro', section: 'Type I / II', color: 'bg-emerald-100 text-emerald-700' },
              { week: 10, title: 'High-Pressure Systems, Equipment & Recovery', section: 'Type II', color: 'bg-amber-100 text-amber-700' },
              { week: 11, title: 'Type II Leak Rates, Evacuation & Review', section: 'Type II', color: 'bg-amber-100 text-amber-700' },
              { week: 12, title: 'Low-Pressure Systems & Centrifugal Chillers', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
              { week: 13, title: 'Type III Recovery, Leak Detection & Water Tubes', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
              { week: 14, title: 'Type III Review & Practice Exam', section: 'Type III', color: 'bg-purple-100 text-purple-700' },
              { week: 15, title: 'Review & Proctored Certification Exam', section: 'Exam', color: 'bg-brand-red-100 text-brand-red-700' },
            ].map((w) => (
              <div
                key={w.week}
                className="flex items-center gap-4 bg-slate-50 rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow"
              >
                <span className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {w.week}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{w.title}</h3>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${w.color}`}>
                  {w.section}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-slate-50 rounded-xl border border-slate-200 p-6">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">Included</div>
                <p className="text-sm text-gray-600 mt-1">Study kits provided to every student</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">70%</div>
                <p className="text-sm text-gray-600 mt-1">Passing score per section (18 of 25)</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Unlimited</div>
                <p className="text-sm text-gray-600 mt-1">Online retesting at no extra cost</p>
              </div>
            </div>
          </div>

          {/* Track options */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-gray-900 mb-1">Standard Track — 15 Weeks</h3>
              <p className="text-sm text-gray-600">
                Flexible scheduling with day and evening options. Designed for working adults. Covers all material at a steady pace with time for review between sessions.
              </p>
            </div>
            <div className="bg-white rounded-xl border-2 border-brand-red-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">Accelerated Track — 6 Weeks</h3>
                <span className="text-xs font-bold bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded-full">Workforce Cohorts</span>
              </div>
              <p className="text-sm text-gray-600">
                Intensive schedule for workforce agency cohorts and sponsored groups. Same curriculum compressed into 6 weeks with multiple sessions per week. Ideal for EmployIndy, WorkOne, and partner referrals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes with real images */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Where This Takes You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              HVAC is a 4-star Indiana Top Job. Every building needs heating and cooling — that means steady work, good pay, and jobs everywhere.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: "HVAC Service Technician",
                salary: "$40,000 – $55,000/year",
                description: "Diagnose and repair heating and cooling systems in homes and businesses. Year-round demand — busy in summer and winter.",
                image: "/images/programs-hq/skilled-trades-hero.jpg",
                alt: "HVAC service technician repairing a residential unit"
              },
              {
                role: "Installation Specialist",
                salary: "$42,000 – $58,000/year",
                description: "Install new HVAC systems in homes and commercial buildings. Strong growth driven by new construction and system upgrades.",
                image: "/images/trades/program-building-construction.jpg",
                alt: "HVAC installer working on a new commercial system"
              },
              {
                role: "Refrigeration Technician",
                salary: "$50,000 – $70,000/year",
                description: "Specialized work on commercial refrigeration and industrial cooling. Higher pay because fewer technicians have this skill set.",
                image: "/images/trades/program-electrical-training.jpg",
                alt: "Refrigeration technician working on commercial equipment"
              }
            ].map((career, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-48">
                  <Image src={career.image} alt={career.alt} fill quality={90} className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{career.role}</h3>
                  <div className="text-brand-green-600 font-bold mb-3">{career.salary}</div>
                  <p className="text-gray-600 text-sm">{career.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Salary data: Bureau of Labor Statistics and Indiana DWD, Indianapolis metro area.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            This Program Is For You If...
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "You want a stable career that pays well without a 4-year degree",
              "You're changing careers and need training that fits around your schedule",
              "You're unemployed or underemployed and want to get into a high-demand trade",
              "You like working with your hands and solving problems",
              "You want to earn certifications that employers actually require",
              "You're interested in eventually starting your own HVAC business",
              "You've been referred by WorkOne or qualify for workforce funding",
              "You're a veteran transitioning to civilian work"
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding — plain language */}
      <section className="py-16 bg-brand-blue-50 border-y">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-full md:w-80 h-64 flex-shrink-0 rounded-2xl overflow-hidden">
              <Image src="/images/programs-hq/students-learning.jpg" alt="Student meeting with a funding advisor" fill quality={90} className="object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How Funding Works</h2>
              <p className="text-gray-700 mb-4">
                Many students have their tuition covered through WIOA (Workforce Innovation and Opportunity Act) or the Workforce Ready Grant — federal and state programs that fund career training for eligible adults.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>To use workforce funding, you must first register at{' '}
                <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 underline hover:text-brand-blue-800">indianacareerconnect.com</a>
                {' '}and visit your local WorkOne office.</strong> WorkOne determines your eligibility and refers you to our program. We then coordinate with them to confirm your enrollment and funding.
              </p>
              <p className="text-gray-700 mb-6">
                If you are not using workforce funding, you can enroll directly with self-pay at $5,000 tuition. Weekly payment plans are available starting at $1,750 down.
              </p>
              <Link
                href="/apply?program=hvac-technician"
                className="inline-flex items-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-full hover:bg-brand-blue-500 transition mb-3"
              >
                Apply
              </Link>
              <p className="text-sm text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-3">
                Do not proceed with enrollment until you have completed WorkOne verification.
              </p>
              <Link
                href="/programs/hvac-technician/apply"
                className="inline-flex items-center px-6 py-3 bg-brand-green-600 text-white font-semibold rounded-full hover:bg-brand-green-500 transition"
              >
                Enroll in Program
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20">
        <Image src="/images/trades/hero-program-plumbing.jpg" alt="HVAC technician at work" fill quality={90} className="object-cover" />
        <div className="absolute inset-0 bg-brand-blue-900/85" />
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start?</h2>
          <Link
            href="/apply?program=hvac-technician"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-full hover:bg-brand-blue-50 transition-all shadow-lg text-lg mb-6"
          >
            Apply
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <div className="bg-yellow-500/20 border border-yellow-400/40 rounded-lg px-4 py-3 max-w-lg mx-auto mb-6">
            <p className="text-sm text-yellow-100 font-semibold text-center">
              Do not proceed with enrollment until you have completed WorkOne verification.{' '}
              <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-yellow-200">
                indianacareerconnect.com
              </a>
            </p>
          </div>

          <Link
            href="/programs/hvac-technician/apply"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-green-500 hover:bg-brand-green-400 text-white font-bold rounded-full transition-all shadow-lg text-lg"
          >
            Enroll in Program
          </Link>
        </div>
      </section>
    </>
  );
}
