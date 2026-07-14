'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  DollarSign, 
  Shield, 
  CreditCard, 
  Building2, 
  GraduationCap,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  HelpCircle,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface FundingExperienceProps {
  className?: string;
}

interface FundingSource {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  coverage: string;
  eligibility: string[];
  color: string;
  href: string;
}

const FUNDING_SOURCES: FundingSource[] = [
  {
    id: 'wioa',
    name: 'WIOA Funding',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Workforce Innovation and Opportunity Act funding may cover 100% of your training costs if you qualify based on employment status, income, or other criteria.',
    coverage: 'Up to 100% of tuition',
    eligibility: [
      'Unemployed or underemployed',
      'Dislocated workers',
      'Low-income individuals',
      'Veterans',
      'Individuals with disabilities',
    ],
    color: 'blue',
    href: '/funding/wioa',
  },
  {
    id: 'vr',
    name: 'Vocational Rehabilitation',
    icon: <Users className="w-6 h-6" />,
    description: 'VR services provide individualized support for people with disabilities to prepare for, obtain, and maintain employment.',
    coverage: 'Varies by individual',
    eligibility: [
      'Physical or mental disability',
      'Barrier to employment',
      'Need for VR services',
      'Ability to benefit from services',
    ],
    color: 'purple',
    href: '/funding/vocational-rehabilitation',
  },
  {
    id: 'pell',
    name: 'Pell Grant',
    icon: <GraduationCap className="w-6 h-6" />,
    description: 'Federal Pell Grants are need-based grants that do not need to be repaid, typically for students demonstrating financial need.',
    coverage: 'Up to $7,395 per year',
    eligibility: [
      'Demonstrate financial need',
      'Have not earned bachelor\'s degree',
      'Enrolled in eligible program',
      'Maintain satisfactory progress',
    ],
    color: 'emerald',
    href: '/funding/pell-grant',
  },
  {
    id: 'bnpl',
    name: 'BNPL Options',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Buy Now, Pay Later options let you spread tuition payments over time with flexible terms and no credit check required.',
    coverage: 'Flexible payment plans',
    eligibility: [
      'Income verification',
      'No credit check required',
      'Flexible terms available',
      '0% interest options',
    ],
    color: 'amber',
    href: '/funding/bnpl',
  },
  {
    id: 'employer',
    name: 'Employer Sponsorship',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Some employers sponsor employees through apprenticeship programs, covering tuition and providing paid on-the-job training.',
    coverage: 'Varies by employer',
    eligibility: [
      'Current employment',
      'Employer partnership',
      'Commitment to program',
      'Continued employment',
    ],
    color: 'slate',
    href: '/funding/employer-sponsorship',
  },
  {
    id: 'self-pay',
    name: 'Self-Pay Plans',
    icon: <DollarSign className="w-6 h-6" />,
    description: 'Affordable monthly payment plans let you spread tuition over the duration of your program with low monthly amounts.',
    coverage: 'Flexible terms',
    eligibility: [
      'Income verification',
      'No credit check',
      'Flexible payment schedule',
      'No interest financing',
    ],
    color: 'brand',
    href: '/funding/self-pay',
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: 'How do I know if I qualify for WIOA funding?',
    answer: 'WIOA eligibility is determined by Indiana WorkOne career specialists. Generally, you may qualify if you are unemployed, underemployed, a dislocated worker, or meet income guidelines. Contact your local WorkOne office to schedule an eligibility assessment.',
  },
  {
    question: 'What if I don\'t qualify for full funding?',
    answer: 'Many students receive partial funding that covers a significant portion of tuition. We also offer flexible payment plans that spread remaining costs over many months with low monthly payments.',
  },
  {
    question: 'Does funding cover books and supplies?',
    answer: 'Some funding sources may cover additional costs beyond tuition. Work with your funding coordinator to understand what is included in your specific award.',
  },
  {
    question: 'How long does the funding approval process take?',
    answer: 'The timeline varies by funding source. WIOA typically takes 1-2 weeks after eligibility determination. Pell Grants are processed with your FAFSA. Our financial aid team will guide you through each step.',
  },
  {
    question: 'Can I use multiple funding sources?',
    answer: 'Yes! Many students combine multiple funding sources—for example, WIOA plus a BNPL plan for any remaining balance. Our team helps you maximize your funding package.',
  },
];

function FundingCard({ source, index }: { source: FundingSource; index: number }) {
  const [expanded, setExpanded] = useState(false);
  
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    slate: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
    brand: 'bg-brand-red-50 border-brand-red-200 hover:bg-brand-red-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-xl border p-6 transition-all ${colorClasses[source.color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
          {source.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">{source.name}</h3>
          <p className="text-sm font-medium text-emerald-600">{source.coverage}</p>
        </div>
      </div>
      
      <p className="text-slate-600 text-sm mb-4">{source.description}</p>
      
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Who qualifies?
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-200"
        >
          <ul className="space-y-2">
            {source.eligibility.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href={source.href}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
          >
            Learn more
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}

function FAQAccordion({ faq, index }: { faq: FAQ; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-slate-200 last:border-0"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-4 flex items-start gap-3 text-left"
      >
        <HelpCircle className="w-5 h-5 text-brand-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-slate-900">{faq.question}</p>
          {expanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-slate-600"
            >
              {faq.answer}
            </motion.p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
    </motion.div>
  );
}

export function FundingExperience({ className = '' }: FundingExperienceProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-white ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-4">
            <DollarSign className="w-4 h-4" />
            Funding Guidance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            How Will You Pay for Your Training?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Most students complete our programs at little to no cost through workforce funding programs.
            Let's find the right option for you.
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white mb-12"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-extrabold">85%</p>
              <p className="text-emerald-100">of students receive funding</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold">$0</p>
              <p className="text-emerald-100">average out-of-pocket cost</p>
            </div>
            <div>
              <p className="text-4xl font-extrabank">100%</p>
              <p className="text-emerald-100">WIOA coverage available</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold">12</p>
              <p className="text-emerald-100">months to pay, 0% interest</p>
            </div>
          </div>
        </motion.div>

        {/* Funding Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Funding Options Available
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUNDING_SOURCES.map((source, index) => (
              <FundingCard key={source.id} source={source} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Eligibility Check CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 rounded-2xl p-8 text-center mb-12"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            Find Out How Much Funding You Qualify For
          </h3>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Complete our 2-minute eligibility check to see which funding sources you may qualify for.
            No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/eligibility"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Check My Eligibility
            </a>
            <a
              href="/schedule-consultation"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Phone className="w-5 h-5" />
              Talk to an Advisor
            </a>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently Asked Questions About Funding
          </h3>
          <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl p-6">
            {FAQS.map((faq, index) => (
              <FAQAccordion key={index} faq={faq} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-slate-600 mb-4">
            Have questions? Our financial aid team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:1-800-314-0123"
              className="inline-flex items-center gap-2 text-brand-red-600 font-semibold hover:text-brand-red-700"
            >
              <Phone className="w-5 h-5" />
              1-800-314-0123
            </a>
            <a
              href="mailto:funding@elevateforhumanity.org"
              className="inline-flex items-center gap-2 text-brand-red-600 font-semibold hover:text-brand-red-700"
            >
              <Mail className="w-5 h-5" />
              funding@elevateforhumanity.org
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default FundingExperience;
