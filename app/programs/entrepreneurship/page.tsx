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
  Phone, GraduationCap, Briefcase, Rocket,
  Users, Lightbulb, Target, BarChart3
} from 'lucide-react';

export default function EntrepreneurshipPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').eq('slug', 'entrepreneurship').limit(1)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need a business idea before enrolling?",
      answer: "No. Week 1 includes a structured ideation process where you'll evaluate market opportunities, assess your skills and interests, and validate a business concept. Many students arrive with a vague idea and leave with a refined, tested business plan. Others discover entirely new directions during the program."
    },
    {
      question: "I already have a business. Is this program still useful?",
      answer: "Yes. About 40% of our students are existing business owners looking to formalize operations, improve marketing, fix their bookkeeping, or access funding. The program covers business structure optimization, financial management, and growth strategies that benefit businesses at any stage."
    },
    {
      question: "What will I have when I graduate?",
      answer: "A complete, lender-ready business plan; your LLC or DBA registered with the Indiana Secretary of State; an EIN from the IRS; a basic bookkeeping system set up in QuickBooks; a marketing plan with social media and local SEO strategy; and connections to SBA lenders and microloan partners."
    },
    {
      question: "How much does the program cost?",
      answer: "Tuition is $1,500 which includes all materials, business registration filing assistance, and QuickBooks access. Weekly payment plans ($250/week for 6 weeks) and BNPL options are available. This is a self-pay program."
    },
    {
      question: "Will you help me get funding for my business?",
      answer: "We connect you with funding sources but don't provide direct funding. You'll learn how to apply for SBA microloans (up to $50,000), prepare for bank loan applications, explore grant opportunities, and evaluate crowdfunding. Our network includes CDFI lenders, SBA resource partners, and local economic development organizations."
    },
    {
      question: "What industries do your graduates start businesses in?",
      answer: "Everything from barbershops and beauty salons to tax preparation offices, cleaning services, food trucks, e-commerce stores, consulting firms, and skilled trades contracting. The business fundamentals we teach apply to any industry."
    },
    {
      question: "Is there mentorship after the program ends?",
      answer: "Yes. Graduates are paired with a local business mentor for 3 months after completion. Mentors are experienced business owners who provide guidance on real challenges as you launch. You also retain access to our alumni network and quarterly business owner meetups."
    },
    {
      question: "What's the schedule like?",
      answer: "6 weeks, meeting Saturday mornings (9 AM–1 PM) plus one weekday evening session per week (6–8 PM). The Saturday sessions are workshop-style where you build your business plan in real time. Weekday sessions cover specific topics like marketing, bookkeeping, and legal structure."
    }
  ];

  const curriculum = [
    {
      week: "Week 1",
      title: "Business Idea Validation & Market Research",
      topics: ["Identifying market opportunities and unmet needs", "Customer discovery interviews and surveys", "Competitive analysis and differentiation", "Lean canvas business model development"],
      project: "Complete a validated lean canvas for your business concept"
    },
    {
      week: "Week 2",
      title: "Legal Structure & Business Registration",
      topics: ["LLC vs. sole proprietorship vs. S-Corp comparison", "Indiana business registration (Secretary of State)", "EIN application and DBA filing", "Business licenses, permits, and zoning requirements"],
      project: "Register your business entity and obtain your EIN"
    },
    {
      week: "Week 3",
      title: "Financial Planning & Bookkeeping Setup",
      topics: ["Startup cost estimation and budgeting", "QuickBooks Online setup for your business", "Invoicing, expense tracking, and cash flow basics", "Separating personal and business finances"],
      project: "Set up QuickBooks with your chart of accounts and first transactions"
    },
    {
      week: "Week 4",
      title: "Marketing & Customer Acquisition",
      topics: ["Brand identity: name, logo, messaging", "Social media strategy (Instagram, Facebook, Google Business)", "Local SEO and Google Maps optimization", "Pricing strategy and revenue modeling"],
      project: "Launch your Google Business Profile and social media accounts"
    },
    {
      week: "Week 5",
      title: "Funding & Financial Access",
      topics: ["SBA microloan programs and CDFI lenders", "Bank loan application preparation", "Grant opportunities for small businesses", "Crowdfunding and alternative financing"],
      project: "Complete a loan-ready financial projection spreadsheet"
    },
    {
      week: "Week 6",
      title: "Business Plan Presentation & Launch",
      topics: ["Business plan finalization and review", "Pitch preparation and delivery practice", "Mentor matching and post-program support", "90-day launch action plan"],
      project: "Present your business plan to a panel of mentors and lenders"
    }
  ];

  const stats = [
    { value: "6", label: "Weeks to Launch", icon: Calendar },
    { value: "$1.5K", label: "Program Tuition", icon: DollarSign },
    { value: "3 Mo", label: "Post-Grad Mentorship", icon: Users },
    { value: "LLC", label: "Business Registered", icon: Briefcase }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/business-finance.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Business', href: '/programs/business' },
            { label: 'Entrepreneurship' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/business-training.jpg" alt="Entrepreneurship and small business training workshop" fill sizes="100vw" className="object-cover" priority />
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
                <stat.icon className="w-8 h-8 text-brand-green-600 mx-auto mb-2" />
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
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Program Structure
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Entrepreneurship & Small Business
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A 6-week intensive that takes you from business idea to registered company with a lender-ready business plan. Saturday workshops build your plan in real time. Weekday sessions cover marketing, bookkeeping, legal structure, and funding.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">24</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Saturday Workshop Hours</div>
              <p className="text-gray-600 text-sm">Hands-on Saturday sessions (9 AM–1 PM) where you build your business plan section by section with instructor guidance and peer feedback.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-7 h-7 text-brand-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">12</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekday Evening Hours</div>
              <p className="text-gray-600 text-sm">Focused topic sessions (Tue 6–8 PM) covering marketing, bookkeeping, legal, and funding with guest speakers from the business community.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-brand-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">3</div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Months Mentorship</div>
              <p className="text-gray-600 text-sm">Post-graduation mentorship with an experienced local business owner. Monthly check-ins, on-demand advice, and access to the alumni network.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Tuition & Payment</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">$1,500</div>
                <p className="text-sm text-gray-500">Total tuition (all materials included)</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Weekly Payment Plans</div>
                <p className="text-sm text-gray-500">6 weekly payments of $250</p>
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

      {/* Why Entrepreneurship */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Why Start a Business?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Build Something That&apos;s Yours
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Small businesses create two-thirds of new jobs in America. This program gives you the tools, knowledge, and connections to join them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Control Your Income",
                description: "Business owners set their own rates, choose their clients, and scale on their own terms. Your earning potential is limited only by your effort and market demand.",
                image: "/images/programs-hq/business-office.jpg"
              },
              {
                title: "Build Generational Wealth",
                description: "A business is an asset you can grow, sell, or pass down. Unlike a paycheck, a business builds equity over time and creates opportunities for your family.",
                image: "/images/heroes-hq/success-hero.jpg"
              },
              {
                title: "Solve Real Problems",
                description: "The best businesses solve problems people are willing to pay for. You'll learn to identify unmet needs in your community and build solutions around them.",
                image: "/images/heroes-hq/how-it-works-hero.jpg"
              },
              {
                title: "Flexible Schedule",
                description: "Design your work around your life, not the other way around. Many small business owners work hard but on their own terms — choosing when, where, and how they work.",
                image: "/images/programs-hq/students-learning.jpg"
              },
              {
                title: "Community Impact",
                description: "Small businesses are the backbone of local economies. When you start a business, you create jobs, serve neighbors, and strengthen your community.",
                image: "/images/heroes-hq/employer-hero.jpg"
              },
              {
                title: "Stack with Other Programs",
                description: "Combine entrepreneurship with our tax preparation, bookkeeping, barber, or trades programs. Learn a skill AND learn how to build a business around it.",
                image: "/images/programs-hq/training-classroom.jpg"
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
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
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
                    <div className="text-xs font-semibold text-brand-green-600 uppercase tracking-wide">{module.week}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-2 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="text-gray-600 text-sm">• {topic}</div>
                      ))}
                    </div>
                    <div className="bg-brand-green-50 rounded-lg px-4 py-2 text-sm">
                      <span className="font-semibold text-brand-green-700">Deliverable:</span> <span className="text-brand-green-600">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Graduate With */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">What You Graduate With</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Registered Business Entity", desc: "LLC or DBA filed with Indiana Secretary of State, EIN obtained, business bank account opened.", image: "/images/programs-hq/business-office.jpg" },
              { title: "Lender-Ready Business Plan", desc: "Complete business plan with market analysis, financial projections, and operational strategy — ready for SBA lenders.", image: "/images/programs-hq/business-training.jpg" },
              { title: "Marketing Foundation", desc: "Google Business Profile, social media accounts, brand identity, and a 90-day marketing action plan.", image: "/images/programs-hq/students-learning.jpg" },
              { title: "Mentor & Network", desc: "Matched with an experienced business mentor for 3 months. Access to alumni network and quarterly meetups.", image: "/images/heroes-hq/career-services-hero.jpg" },
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
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
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
      <section className="py-20 bg-brand-green-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Launch Your Business?</h2>
          <p className="text-lg text-brand-green-100 mb-8 max-w-2xl mx-auto">
            Submit an inquiry to learn about the next cohort, payment options, and what to expect on day one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=entrepreneurship" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-green-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg">
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
