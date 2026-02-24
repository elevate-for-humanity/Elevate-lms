'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { createBrowserClient } from '@supabase/ssr';
import {
  Clock, DollarSign, TrendingUp, ArrowRight,
  Award, Calendar, ChevronDown, ChevronUp,
  Phone, GraduationCap, Briefcase, Calculator,
  FileText, BarChart3, BookOpen, Users
} from 'lucide-react';

export default function BookkeepingPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').eq('slug', 'bookkeeping').limit(1)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need accounting experience to enroll?",
      answer: "No. This program is designed for complete beginners. We start with the fundamentals — what debits and credits are, how a chart of accounts works, and how to record everyday business transactions. No math beyond basic arithmetic is required."
    },
    {
      question: "What software will I learn?",
      answer: "You'll become proficient in QuickBooks Online, the most widely used small business accounting software. You'll learn setup, daily transactions, invoicing, bill pay, bank reconciliation, payroll, and financial reporting. You'll also be prepared for the QuickBooks Certified User exam."
    },
    {
      question: "How long is the program and what's the schedule?",
      answer: "8 weeks total. Classes meet two evenings per week (6:00–9:00 PM) plus self-paced LMS coursework you complete on your own schedule. Total instructional hours: approximately 96 hours including classroom, lab, and online modules."
    },
    {
      question: "What credentials will I earn?",
      answer: "You'll earn the QuickBooks Certified User credential (administered by Certiport/Intuit) and a Certificate of Completion from Elevate for Humanity. The QuickBooks certification is recognized by employers nationwide and validates your ability to manage business finances using QuickBooks."
    },
    {
      question: "What jobs can I get after completing this program?",
      answer: "Graduates work as bookkeepers, accounts payable/receivable clerks, payroll clerks, billing specialists, and office managers. Many also freelance as independent bookkeepers serving multiple small businesses. Indiana bookkeepers earn $38,000–$48,000 on average, with experienced bookkeepers earning $55,000+."
    },
    {
      question: "Can I use this to start my own bookkeeping business?",
      answer: "Yes. Many graduates launch freelance bookkeeping practices. You'll learn everything needed to manage client books — from onboarding a new client to delivering monthly financial statements. Pair this with our Entrepreneurship program for a complete business launch plan."
    },
    {
      question: "How much does the program cost?",
      answer: "Tuition is $2,800 which includes all materials, QuickBooks Online access, and one attempt at the QuickBooks Certified User exam. Weekly payment plans and BNPL (Buy Now, Pay Later) options are available. This program is self-pay — it is not currently funded through WorkOne/WIOA."
    },
    {
      question: "Is this program available online?",
      answer: "The program uses a hybrid model. Evening classroom sessions are held in-person at our Indianapolis training center. The LMS coursework (approximately 40% of the program) is completed online at your own pace. All materials are accessible 24/7 through the student portal."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Accounting Fundamentals",
      topics: ["The accounting equation: Assets = Liabilities + Equity", "Debits, credits, and double-entry bookkeeping", "Chart of accounts setup and customization", "Recording transactions: sales, purchases, expenses"],
      project: "Set up a complete chart of accounts for a sample business"
    },
    {
      week: "Weeks 3-4",
      title: "QuickBooks Online Mastery",
      topics: ["Company setup and preferences", "Customer invoicing and payment tracking", "Vendor bills and bill payment workflows", "Bank and credit card account connections"],
      project: "Process one month of transactions for a simulated business"
    },
    {
      week: "Week 5",
      title: "Payroll & Tax Withholding",
      topics: ["Employee setup and pay schedules", "Federal and state tax withholding calculations", "Payroll processing in QuickBooks", "Quarterly payroll tax reporting (941, state UI)"],
      project: "Run a complete payroll cycle with tax calculations"
    },
    {
      week: "Week 6",
      title: "Bank Reconciliation & Month-End Close",
      topics: ["Bank reconciliation procedures", "Adjusting journal entries", "Accruals and prepaid expenses", "Month-end closing checklist"],
      project: "Complete a full month-end close with reconciled accounts"
    },
    {
      week: "Week 7",
      title: "Financial Reporting & Analysis",
      topics: ["Profit & Loss statement", "Balance sheet", "Cash flow statement", "Sales tax reporting and compliance"],
      project: "Generate and interpret a complete set of financial statements"
    },
    {
      week: "Week 8",
      title: "Certification Prep & Career Launch",
      topics: ["QuickBooks Certified User exam preparation", "Practice exams and review", "Resume building and job search strategies", "Freelance bookkeeping business setup"],
      project: "Pass the QuickBooks Certified User certification exam"
    }
  ];

  const stats = [
    { value: "$43K", label: "Average Indiana Salary", icon: DollarSign },
    { value: "8", label: "Weeks to Certified", icon: Calendar },
    { value: "96", label: "Instructional Hours", icon: Clock },
    { value: "QBO", label: "QuickBooks Certified", icon: Award }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/business-finance.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Business', href: '/programs/business' },
            { label: 'Bookkeeping & Accounting' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/business-office.jpg" alt="Bookkeeping and accounting training classroom" fill sizes="100vw" className="object-cover" priority />
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
                <stat.icon className="w-8 h-8 text-brand-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Program Structure
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Bookkeeping & Accounting Fundamentals
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              An 8-week hybrid program combining evening classroom instruction with self-paced LMS coursework. Learn QuickBooks Online, payroll processing, financial reporting, and earn your QuickBooks Certified User credential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">48</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classroom Hours</div>
              <p className="text-gray-600 text-sm">Evening sessions (Tue/Thu 6–9 PM) covering accounting theory, QuickBooks operations, payroll, and financial reporting with hands-on exercises.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">36</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Lab & Practice Hours</div>
              <p className="text-gray-600 text-sm">Guided QuickBooks lab sessions processing real-world transactions, reconciliations, and payroll cycles with instructor support.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">12</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">LMS Self-Paced Hours</div>
              <p className="text-gray-600 text-sm">Online modules with progress tracking, quizzes, and practice exams. Complete on your own schedule with 24/7 access.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Tuition & Payment</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">$2,800</div>
                <p className="text-sm text-gray-500">Total tuition (all materials included)</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Weekly Payment Plans</div>
                <p className="text-sm text-gray-500">Split into 8 weekly payments of $350</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">BNPL Available</div>
                <p className="text-sm text-gray-500">Buy Now, Pay Later through Affirm</p>
              </div>
            </div>
            <FundingBadge type="self-pay" className="mt-4" />
          </div>
        </div>
      </section>

      {/* Why Bookkeeping */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Bookkeeping?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Every Business Needs a Bookkeeper
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              There are 33 million small businesses in the U.S. Most can&apos;t afford a full-time accountant but need someone to manage their books. That&apos;s where you come in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Stable, Recession-Resistant",
                description: "Businesses need bookkeeping in good times and bad. Tax deadlines don't move. Payroll doesn't stop. This is one of the most stable career paths in business services.",
                image: "/images/programs-hq/business-training.jpg"
              },
              {
                title: "Work Anywhere",
                description: "Bookkeeping is increasingly remote. With cloud-based QuickBooks Online, you can manage clients from home, a coffee shop, or anywhere with internet access.",
                image: "/images/programs-hq/students-learning.jpg"
              },
              {
                title: "Freelance Potential",
                description: "Many bookkeepers run their own practice serving 10–20 small business clients. At $300–$500/month per client, a full book of business generates $60,000–$120,000/year.",
                image: "/images/programs-hq/business-office.jpg"
              },
              {
                title: "Pairs with Tax Preparation",
                description: "Bookkeeping and tax prep are natural complements. Manage client books year-round, then prepare their tax returns in season. Year-round income, no slow months.",
                image: "/images/programs-hq/tax-preparation.jpg"
              },
              {
                title: "No Degree Required",
                description: "Unlike accounting, bookkeeping doesn't require a bachelor's degree or CPA. A QuickBooks certification and practical experience are what employers and clients look for.",
                image: "/images/heroes-hq/career-services-hero.jpg"
              },
              {
                title: "Clear Career Ladder",
                description: "Start as a bookkeeper, advance to full-charge bookkeeper, then controller or office manager. Or specialize in payroll, accounts receivable, or industry-specific bookkeeping.",
                image: "/images/heroes-hq/success-hero.jpg"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl overflow-hidden"
              >
                <div className="relative h-48">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Week-by-Week Curriculum */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Week-by-Week Breakdown
            </h2>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-8 shadow-sm"
              >
                <div className="flex items-start gap-6">
                  <div className="w-20 flex-shrink-0">
                    <div className="text-xs font-semibold text-brand-blue-600 uppercase tracking-wide">{module.week}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-2 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="text-gray-600 text-sm">• {topic}</div>
                      ))}
                    </div>
                    <div className="bg-brand-blue-50 rounded-lg px-4 py-2 text-sm">
                      <span className="font-semibold text-brand-blue-700">Project:</span> <span className="text-brand-blue-600">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12">Credentials Earned</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <div className="relative h-48">
                <Image src="/images/programs-hq/business-office.jpg" alt="QuickBooks Certified User credential" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">QuickBooks Certified User</h3>
                <p className="text-gray-500 text-sm mb-2">Issued by Certiport / Intuit</p>
                <p className="text-gray-600 text-sm">Industry-standard credential validating proficiency in QuickBooks Online for small business accounting, invoicing, payroll, and financial reporting.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <div className="relative h-48">
                <Image src="/images/programs-hq/training-classroom.jpg" alt="Certificate of Completion" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Certificate of Completion</h3>
                <p className="text-gray-500 text-sm mb-2">Issued by Elevate for Humanity</p>
                <p className="text-gray-600 text-sm">Documents 96 instructional hours in bookkeeping fundamentals, QuickBooks operations, payroll processing, and financial reporting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Your Bookkeeping Career</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Submit an inquiry to learn about the next cohort start date, payment options, and enrollment steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=bookkeeping" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">
              Submit Inquiry <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">
              <Phone className="w-5 h-5" /> Call Admissions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
