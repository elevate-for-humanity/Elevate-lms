'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Users,
  DollarSign,
  Clock,
  Briefcase,
  GraduationCap,
  Heart,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface VisitorQuestionsProps {
  className?: string;
}

interface Question {
  id: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
  category: 'about' | 'trust' | 'programs' | 'funding' | 'outcomes';
}

const QUESTIONS: Question[] = [
  {
    id: 'what-is',
    icon: <HelpCircle className="h-5 w-5" aria-hidden="true" />,
    question: 'What is Elevate for Humanity?',
    answer:
      'Elevate for Humanity is a career and technical education and workforce-development organization. The public site explains training programs, registered-apprenticeship pathways, testing options, career services, and funding pathways. Program, approval, credential, and funding details are published separately so applicants can verify what applies to the program they select.',
    category: 'about',
  },
  {
    id: 'who-is-for',
    icon: <Users className="h-5 w-5" aria-hidden="true" />,
    question: 'Who can apply?',
    answer:
      'Adults and other eligible learners may apply to the programs for which they meet the stated admission requirements. Eligibility, age requirements, licensing requirements, funding rules, and available locations vary by program. The application and program pages control rather than a general website statement.',
    category: 'about',
  },
  {
    id: 'why-trust',
    icon: <Shield className="h-5 w-5" aria-hidden="true" />,
    question: 'How can I verify Elevate’s claims?',
    answer:
      'Use the Approvals, Funding, Testing, and individual program pages. Apprenticeship status, training-list eligibility, credential preparation, host-site relationships, and funding are program-specific. Elevate does not treat a logo, a general provider relationship, or an unsupported outcome percentage as proof that every program has the same approval or result.',
    category: 'trust',
  },
  {
    id: 'what-programs',
    icon: <GraduationCap className="h-5 w-5" aria-hidden="true" />,
    question: 'What programs are available?',
    answer:
      'Current offerings are listed in the Program Directory and include pathways in healthcare, skilled trades, transportation, business, technology, barbering, and beauty. Availability changes, so use the program directory rather than an older static list when choosing a course.',
    category: 'programs',
  },
  {
    id: 'how-long',
    icon: <Clock className="h-5 w-5" aria-hidden="true" />,
    question: 'How long does training take?',
    answer:
      'Program length depends on required instructional hours, apprenticeship or clinical requirements, delivery schedule, transfer-credit decisions, and the credential or license pathway. The duration shown on the individual program page is the applicable estimate for that program.',
    category: 'programs',
  },
  {
    id: 'how-much',
    icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
    question: 'How much does it cost?',
    answer:
      'Tuition and required fees vary by program. Some eligible participants may receive workforce or vocational-rehabilitation funding, while other programs are self-pay or use an approved payment arrangement. Funding is never guaranteed by a website label; the responsible agency determines participant eligibility and the amount authorized.',
    category: 'funding',
  },
  {
    id: 'can-funding',
    icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
    question: 'Can I get funding for training?',
    answer:
      'Possibly. WIOA, state workforce programs, vocational rehabilitation, employer sponsorship, or other assistance may apply depending on the participant, program, location, available funds, and agency rules. Complete the preliminary eligibility process and obtain written authorization from the responsible funder before relying on funding.',
    category: 'funding',
  },
  {
    id: 'what-careers',
    icon: <Briefcase className="h-5 w-5" aria-hidden="true" />,
    question: 'What career opportunities exist?',
    answer:
      'Each program is tied to a specific occupational pathway and credential or licensing objective where applicable. Job titles, openings, wages, and licensing rules vary by occupation and location. Review the individual program page and current labor-market information for the occupation you are considering.',
    category: 'outcomes',
  },
  {
    id: 'what-earn',
    icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
    question: 'What will I earn after graduation?',
    answer:
      'Elevate does not guarantee a wage. Earnings depend on occupation, geography, employer, experience, schedule, licensing status, and market conditions. When wage information is shown on a program page, treat it as labor-market information rather than a promise of an individual outcome.',
    category: 'outcomes',
  },
  {
    id: 'can-job',
    icon: <Heart className="h-5 w-5" aria-hidden="true" />,
    question: 'Will you help me get a job?',
    answer:
      'Career-support services can include resume preparation, interview practice, employer referrals, and job-search assistance when those services are part of the learner’s program. Employment is not guaranteed, and hiring decisions remain with employers.',
    category: 'outcomes',
  },
];

const CATEGORY_CONFIG = {
  about: { label: 'About Elevate', color: 'bg-blue-100 text-blue-800' },
  trust: { label: 'Trust & Credibility', color: 'bg-purple-100 text-purple-800' },
  programs: { label: 'Programs', color: 'bg-emerald-100 text-emerald-800' },
  funding: { label: 'Funding & Cost', color: 'bg-amber-100 text-amber-900' },
  outcomes: { label: 'Careers & Jobs', color: 'bg-rose-100 text-rose-800' },
};

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[question.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-slate-200 bg-white transition-all hover:border-brand-red-200 hover:shadow-md"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${config.color}`}>
          {question.icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-950">{question.question}</p>
          <p className={`mt-1 text-sm text-slate-600 ${expanded ? 'line-clamp-none' : 'line-clamp-2'}`}>
            {question.answer}
          </p>
        </div>
        <div className="flex-shrink-0 text-slate-600" aria-hidden="true">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5">
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm leading-relaxed text-slate-700">{question.answer}</p>
            <a
              href="/contact"
              className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-brand-red-700 hover:text-brand-red-800"
            >
              Still have questions? Contact us
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function VisitorQuestions({ className = '' }: VisitorQuestionsProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const filteredQuestions = activeCategory ? QUESTIONS.filter((question) => question.category === activeCategory) : QUESTIONS;

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className={`bg-slate-50 py-20 ${className}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-red-200 bg-brand-red-100 px-4 py-2 text-sm font-bold text-brand-red-800">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Answers Before You Apply
          </div>
          <h2 className="mb-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">Questions Applicants Ask Most</h2>
          <p className="mx-auto max-w-2xl text-slate-700">
            These answers explain the general process. Program-specific requirements, funding decisions, and written enrollment documents control when they differ.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${!activeCategory ? 'bg-brand-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            All Questions
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              type="button"
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeCategory === key ? 'bg-brand-red-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
            >
              {config.label}
            </button>
          ))}
        </motion.div>

        <div className="space-y-3">
          {filteredQuestions.map((question, index) => <QuestionCard key={question.id} question={question} index={index} />)}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <p className="mb-4 text-slate-700">Ready to compare a program, its requirements, and possible funding?</p>
          <a
            href="/programs"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white shadow-lg shadow-brand-red-600/20 transition-colors hover:bg-brand-red-700"
          >
            Review Programs
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
