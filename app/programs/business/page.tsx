'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createBrowserClient } from '@supabase/ssr';
import {
  DollarSign, ArrowRight, Calendar, ChevronDown, ChevronUp,
  Phone, Briefcase, Calculator, Rocket, FileText, Users
} from 'lucide-react';

export default function BusinessProgramsPage() {
  const [dbPrograms, setDbPrograms] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').in('category', ['Business', 'Business & Financial', 'Financial']).limit(20)
      .then(({ data }) => { if (data) setDbPrograms(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const programs = [
    {
      title: "Tax Preparation & Financial Services",
      slug: "tax-preparation",
      description: "Become a licensed tax preparer. Earn your AFSP credential and learn individual and business returns, refund advances, and IRS compliance. Pair with bookkeeping for year-round income.",
      duration: "8 weeks",
      price: "$3,200",
      funding: "Self-Pay / BNPL",
      image: "/images/programs-hq/tax-preparation.jpg"
    },
    {
      title: "Bookkeeping & Accounting Fundamentals",
      slug: "bookkeeping",
      description: "Master QuickBooks Online, payroll processing, bank reconciliation, and financial reporting. Earn the QuickBooks Certified User credential. Ideal for career changers and small business owners.",
      duration: "8 weeks",
      price: "$2,800",
      funding: "Self-Pay / BNPL",
      image: "/images/programs-hq/business-office.jpg"
    },
    {
      title: "Entrepreneurship & Small Business",
      slug: "entrepreneurship",
      description: "Launch or grow a small business. Build a lender-ready business plan, register your LLC, set up bookkeeping, and connect with SBA microloan partners. Includes 3 months of post-grad mentorship.",
      duration: "6 weeks",
      price: "$1,500",
      funding: "Self-Pay / BNPL",
      image: "/images/programs-hq/business-training.jpg"
    },
    {
      title: "Office Administration",
      slug: "office-administration",
      description: "Microsoft Office Suite proficiency, business communication, scheduling, data entry, and administrative procedures. Prepares you for office coordinator, receptionist, and administrative assistant roles.",
      duration: "10 weeks",
      price: "$4,200",
      funding: "WorkOne Eligible",
      image: "/images/programs-hq/business-office.jpg"
    },
    {
      title: "Project Management",
      slug: "project-management",
      description: "Project planning, Agile/Scrum methodology, stakeholder management, risk assessment, and CAPM exam preparation. Applicable across industries from construction to technology.",
      duration: "10 weeks",
      price: "$4,730",
      funding: "WorkOne Eligible",
      image: "/images/programs-hq/business-training.jpg"
    }
  ];

  const faqs = [
    {
      question: "Which business program is right for me?",
      answer: "It depends on your goal. If you want a job in accounting or finance, start with Bookkeeping. If you want to prepare tax returns (seasonal or year-round), choose Tax Preparation. If you want to start your own business in any industry, Entrepreneurship is the right fit. Office Administration is ideal if you want a stable office job. Project Management works across industries."
    },
    {
      question: "Can I take more than one program?",
      answer: "Yes, and we encourage it. Bookkeeping + Tax Preparation is our most popular combination — it gives you year-round income (bookkeeping) plus seasonal tax prep revenue. Entrepreneurship pairs well with any skill program (barber, trades, tax prep) if you plan to start your own business."
    },
    {
      question: "Are any of these programs funded through WorkOne?",
      answer: "Office Administration and Project Management are on the ETPL (Eligible Training Provider List) and may be funded through WorkOne/WIOA. You must register at indianacareerconnect.com and visit your local WorkOne office to determine eligibility. Tax Preparation, Bookkeeping, and Entrepreneurship are self-pay programs with payment plans available."
    },
    {
      question: "Do I need a college degree for these careers?",
      answer: "No. None of these programs require a college degree as a prerequisite. Bookkeepers, tax preparers, and office administrators are hired based on certifications and demonstrated skills, not degrees. Our programs provide the credentials employers look for."
    },
    {
      question: "What's the earning potential?",
      answer: "Office administrators: $32,000–$42,000. Bookkeepers: $38,000–$48,000. Tax preparers: $35,000–$55,000 (seasonal income can be higher per hour). Project managers: $55,000–$75,000. Entrepreneurs: unlimited, depending on your business. All figures are Indiana averages."
    },
    {
      question: "Are evening and weekend classes available?",
      answer: "Yes. All business programs offer evening schedules (typically 6–9 PM, two nights per week). Entrepreneurship also includes Saturday morning workshops. This allows you to keep your current job while training for your next career."
    }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/business-finance.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Business & Financial' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/business-training.jpg" alt="Business and financial training programs at Elevate for Humanity" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            5 Programs Available
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Business & Financial Programs
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Tax preparation, bookkeeping, entrepreneurship, office administration, and project management. Whether you want a stable office career, a freelance practice, or to launch your own business — we have a program for you.
          </p>
        </div>
      </section>

      {/* Program Cards */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {programs.map((program, index) => (
              <motion.div
                key={program.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/programs/${program.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition">
                  <div className="grid md:grid-cols-5 gap-0">
                    <div className="md:col-span-2 relative h-64 md:h-auto">
                      <Image src={program.image} alt={program.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="md:col-span-3 p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-brand-blue-50 text-brand-blue-700 rounded-full text-xs font-semibold">{program.funding}</span>
                        <span className="text-sm text-gray-500">{program.duration}</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-brand-blue-600 transition-colors">{program.title}</h3>
                      <p className="text-gray-600 mb-4">{program.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{program.price}</span>
                        <span className="inline-flex items-center gap-1 text-brand-blue-600 font-semibold group-hover:gap-2 transition-all">
                          View Program <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Salary Comparison */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Indiana Salary Ranges</h2>
            <p className="text-gray-600">Average annual salaries for business and financial careers in Indiana (BLS data).</p>
          </div>
          <div className="space-y-4">
            {[
              { role: "Office Administrator / Receptionist", range: "$32,000 – $42,000", bar: 42 },
              { role: "Bookkeeper / Accounting Clerk", range: "$38,000 – $48,000", bar: 52 },
              { role: "Tax Preparer (seasonal, annualized)", range: "$35,000 – $55,000", bar: 58 },
              { role: "Payroll Specialist", range: "$40,000 – $52,000", bar: 55 },
              { role: "Project Manager (CAPM)", range: "$55,000 – $75,000", bar: 75 },
              { role: "Freelance Bookkeeper (full book)", range: "$60,000 – $120,000", bar: 90 },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-50 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{item.role}</span>
                  <span className="text-brand-blue-600 font-bold">{item.range}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-brand-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${item.bar}%` }} />
                </div>
              </motion.div>
            ))}
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Your Business Career</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Not sure which program is right for you? Submit an inquiry and an advisor will help you choose based on your goals, schedule, and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=business" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">
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
