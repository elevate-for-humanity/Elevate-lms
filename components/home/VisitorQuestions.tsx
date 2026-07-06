'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  CheckCircle, 
  Users, 
  DollarSign, 
  Clock, 
  Briefcase, 
  GraduationCap,
  Heart,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp
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
  // About
  {
    id: 'what-is',
    icon: <HelpCircle className="w-5 h-5" />,
    question: 'What is Elevate for Humanity?',
    answer: 'Elevate for Humanity is a workforce development organization that guides people from unemployment to employment. We partner with government agencies, employers, and training providers to offer paid apprenticeships, funded training, and career pathways in healthcare, skilled trades, beauty, and logistics. Our mission is to help individuals transform their lives through career education.',
    category: 'about',
  },
  {
    id: 'who-is-for',
    icon: <Users className="w-5 h-5" />,
    question: 'Who is Elevate for?',
    answer: 'Elevate serves anyone seeking to start or advance a career. Whether you are unemployed, underemployed, a career changer, a veteran, a person with a disability, or someone looking to gain new skills, we have programs and funding options designed to help you succeed. Our programs are available throughout Indiana.',
    category: 'about',
  },
  
  // Trust
  {
    id: 'why-trust',
    icon: <Shield className="w-5 h-5" />,
    question: 'Why should I trust Elevate?',
    answer: 'Elevate is a DOL-registered apprenticeship sponsor, WIOA-approved training provider, and WorkOne partner. We have helped over 2,000 graduates earn credentials and find employment. Our 98% license exam pass rate and partnerships with 40+ employers demonstrate our commitment to your success.',
    category: 'trust',
  },
  
  // Programs
  {
    id: 'what-programs',
    icon: <GraduationCap className="w-5 h-5" />,
    question: 'What programs are available?',
    answer: 'We offer programs in: Barbering (with apprenticeship), HVAC/R Technician, CNA with Medication Aide, CDL Training, and Medical Billing. Each program includes classroom instruction, hands-on training, and job placement support. Programs range from 8 weeks to 18 months depending on the career path.',
    category: 'programs',
  },
  {
    id: 'how-long',
    icon: <Clock className="w-5 h-5" />,
    question: 'How long does training take?',
    answer: 'Program lengths vary by career path. CDL training takes 8-12 weeks. CNA programs are 4-8 months. HVAC technician training is 10-14 months. Barbering with apprenticeship is 12-18 months. Most programs offer flexible scheduling to accommodate work and family commitments.',
    category: 'programs',
  },
  
  // Funding
  {
    id: 'how-much',
    icon: <DollarSign className="w-5 h-5" />,
    question: 'How much does it cost?',
    answer: 'Most students pay $0 to $500 out of pocket. Through WIOA funding, Vocational Rehabilitation, and Pell Grants, up to 100% of tuition may be covered. We also offer 0% interest payment plans starting at $29/month. Your funding coordinator will help you explore all options.',
    category: 'funding',
  },
  {
    id: 'can-funding',
    icon: <DollarSign className="w-5 h-5" />,
    question: 'Can I get funding for training?',
    answer: 'Yes! 85% of our students receive some form of funding. WIOA funding may cover up to 100% based on eligibility. Vocational Rehabilitation provides individualized support. Pell Grants are available for those who qualify. Employer sponsorships are also available in some programs. Complete our eligibility check to see what you qualify for.',
    category: 'funding',
  },
  
  // Outcomes
  {
    id: 'what-careers',
    icon: <Briefcase className="w-5 h-5" />,
    question: 'What career opportunities exist?',
    answer: 'Our graduates work as licensed barbers, HVAC technicians, certified nursing assistants, CDL drivers, and medical billing specialists. Starting salaries range from $30,000-$50,000 annually, with experienced professionals earning $60,000-$90,000+. 85% of graduates find employment within 6 months of completing their program.',
    category: 'outcomes',
  },
  {
    id: 'what-earn',
    icon: <DollarSign className="w-5 h-5" />,
    question: 'What will I earn after graduation?',
    answer: 'Graduate salaries vary by field and experience. Entry-level barbers earn $35,000-$45,000. HVAC technicians start at $42,000-$55,000. CNAs earn $30,000-$38,000. CDL drivers earn $50,000-$72,000. With experience, you can earn significantly more—senior barbers and shop owners can earn $75,000+ annually.',
    category: 'outcomes',
  },
  {
    id: 'can-job',
    icon: <Heart className="w-5 h-5" />,
    question: 'Will you help me get a job?',
    answer: 'Yes! Job placement is built into every program. Our employer partnerships mean most graduates have job offers before or shortly after completing their credentials. We assist with resume writing, interview preparation, and job searches. Many employers actively recruit from our programs.',
    category: 'outcomes',
  },
];

const CATEGORY_CONFIG = {
  about: { label: 'About Elevate', color: 'bg-blue-100 text-blue-700' },
  trust: { label: 'Trust & Credibility', color: 'bg-purple-100 text-purple-700' },
  programs: { label: 'Programs', color: 'bg-emerald-100 text-emerald-700' },
  funding: { label: 'Funding & Cost', color: 'bg-amber-100 text-amber-700' },
  outcomes: { label: 'Careers & Jobs', color: 'bg-rose-100 text-rose-700' },
};

function QuestionCard({ 
  question, 
  index 
}: { 
  question: Question; 
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[question.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 hover:border-brand-red-200 hover:shadow-md transition-all"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-start gap-4 text-left"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
          {question.icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{question.question}</p>
          <p className={`text-sm text-slate-500 mt-1 ${expanded ? 'line-clamp-none' : 'line-clamp-2'}`}>
            {question.answer}
          </p>
        </div>
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-5 pb-5"
        >
          <div className="pt-4 border-t border-slate-100">
            <p className="text-slate-600 text-sm leading-relaxed">
              {question.answer}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-brand-red-600 hover:text-brand-red-700"
            >
              Still have questions? Contact us
              <ArrowRight className="w-4 h-4" />
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

  const filteredQuestions = activeCategory
    ? QUESTIONS.filter(q => q.category === activeCategory)
    : QUESTIONS;

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-slate-50 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 border border-brand-red-200 rounded-full text-brand-red-700 text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Answers Before You Ask
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            We answer your questions before you have to search for them. 
            Here's what visitors most want to know about Elevate.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !activeCategory
                ? 'bg-brand-red-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Questions
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === key
                  ? 'bg-brand-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {config.label}
            </button>
          ))}
        </motion.div>

        {/* Questions */}
        <div className="space-y-3">
          {filteredQuestions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <p className="text-slate-600 mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors shadow-lg shadow-brand-red-600/30"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default VisitorQuestions;
