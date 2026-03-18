'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { createBrowserClient } from '@supabase/ssr';
import {
  Clock, DollarSign, TrendingUp, ArrowRight,
  Award, Calendar, ChevronDown, ChevronUp,
  GraduationCap, Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface CareerStep {
  title: string;
  salary: string;
  time: string;
  desc: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface DeliveryBlock {
  icon: LucideIcon;
  hours: number | string;
  label: string;
  description: string;
}

interface ProgramImage {
  src: string;
  alt: string;
}

export interface PublicProgramPageConfig {
  // DB identifiers
  programSlug: string;
  courseId?: string; // for fetching course_modules

  // Hero
  videoSrc: string;
  voiceoverSrc?: string;
  heroImage: ProgramImage;

  // Navigation
  breadcrumbs: BreadcrumbItem[];

  // Accent color — used for badges, icons, stat highlights
  accentColor: {
    bg: string;      // e.g. 'bg-yellow-100'
    text: string;    // e.g. 'text-yellow-700'
    iconBg: string;  // e.g. 'bg-yellow-100'
    iconText: string; // e.g. 'text-yellow-600'
    dark: string;    // e.g. 'text-yellow-300' (for dark sections)
    darkAccent: string; // e.g. 'text-yellow-400' (for dark section numbers)
  };

  // Stats bar (4 items)
  stats: StatItem[];

  // Program overview section
  overview: {
    title: string;
    subtitle: string;
    description: string;
  };

  // Delivery model (3 blocks: classroom, site days, LMS)
  delivery: DeliveryBlock[];

  // Funding type
  fundingType: 'funded' | 'self-pay';
  fundingNote?: string;

  // "Why this program" feature cards
  features: {
    sectionTitle: string;
    sectionSubtitle: string;
    sectionDescription: string;
    cards: FeatureCard[];
  };

  // Images for content sections (no Lucide icons as content)
  sectionImages?: {
    overview?: ProgramImage;
    curriculum?: ProgramImage;
    career?: ProgramImage;
  };

  // Career path steps
  careerPath: {
    title: string;
    steps: CareerStep[];
  };

  // FAQ
  faqs: FaqItem[];

  // CTA
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
}

// ─── DB types ────────────────────────────────────────────────────────────────

interface ProgramRow {
  title: string;
  description: string;
  estimated_weeks: number | null;
  estimated_hours: number | null;
  salary_min: number | null;
  salary_max: number | null;
  credential_name: string | null;
  delivery_method: string | null;
  training_hours: number | null;
  career_outcomes: string[] | null;
  what_you_learn: string[] | null;
  wioa_approved: boolean;
  dol_registered: boolean;
  placement_rate: number | null;
  completion_rate: number | null;
  total_cost: string | null;
  category: string | null;
}

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicProgramPage({ config }: { config: PublicProgramPageConfig }) {
  const [program, setProgram] = useState<ProgramRow | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fetchData = async () => {
      const [programRes, modulesRes] = await Promise.all([
        supabase
          .from('programs')
          .select('title, description, estimated_weeks, estimated_hours, salary_min, salary_max, credential_name, delivery_method, training_hours, career_outcomes, what_you_learn, wioa_approved, dol_registered, placement_rate, completion_rate, total_cost, category')
          .eq('slug', config.programSlug)
          .single(),
        config.courseId
          ? supabase
              .from('course_modules')
              .select('id, title, description, order_index, duration')
              .eq('course_id', config.courseId)
              .order('order_index')
          : Promise.resolve({ data: [] as CourseModule[], error: null }),
      ]);

      if (programRes.data) setProgram(programRes.data as ProgramRow);
      if (modulesRes.data) setModules(modulesRes.data as CourseModule[]);
      setLoading(false);
    };

    fetchData();
  }, [config.programSlug, config.courseId]);

  const c = config.accentColor;

  return (
    <>
      {/* Video Hero Banner */}
      {/* Hero — clean media, no text overlay. Identity block renders below. */}
      <ProgramHeroBanner
        videoSrc={config.videoSrc}
        voiceoverSrc={config.voiceoverSrc}
        posterImage={config.posterImage}
      />

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={config.breadcrumbs} />
        </div>
      </div>

      {/* Hero Image — clean, no text overlay */}
      <section className="relative h-[45vh] min-h-[280px] max-h-[560px] overflow-hidden">
        <Image
          src={config.heroImage.src}
          alt={config.heroImage.alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {config.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className={`w-8 h-8 ${c.iconText} mx-auto mb-2`} />
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Overview + Delivery Model */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={`inline-block ${c.bg} ${c.text} text-sm font-semibold px-4 py-1 rounded-full mb-4`}>
              Program Structure
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {config.overview.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              {program?.description || config.overview.description}
            </p>
          </div>

          {/* Funding Badge */}
          <div className="flex justify-center mb-8">
            <FundingBadge type={config.fundingType} />
          </div>

          {/* Delivery Blocks */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {config.delivery.map((block, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className={`w-14 h-14 ${c.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <block.icon className={`w-7 h-7 ${c.iconText}`} />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{block.hours}</div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{block.label}</div>
                <p className="text-slate-600 text-sm">{block.description}</p>
              </div>
            ))}
          </div>

          {config.fundingNote && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <h3 className="text-xl font-bold mb-3">Funding Options</h3>
              <p className="text-slate-600">{config.fundingNote}</p>
            </div>
          )}
        </div>
      </section>

      {/* Section Image — Overview */}
      {config.sectionImages?.overview && (
        <section className="relative h-[200px] sm:h-[280px] md:h-[360px]">
          <Image
            src={config.sectionImages.overview.src}
            alt={config.sectionImages.overview.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </section>
      )}

      {/* Why This Program — Feature Cards */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block ${c.bg} ${c.text} text-sm font-semibold px-4 py-1 rounded-full mb-4`}>
              {config.features.sectionTitle}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {config.features.sectionSubtitle}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {config.features.sectionDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {config.features.cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <card.icon className={`w-6 h-6 ${c.iconText}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-600">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum from DB */}
      <section id="curriculum" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={`inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4`}>
              Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What You&apos;ll Learn
            </h2>
            {program?.what_you_learn && program.what_you_learn.length > 0 && (
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {program.estimated_weeks ? `${program.estimated_weeks} weeks` : ''}{program.training_hours ? ` · ${program.training_hours} instructional hours` : ''}
              </p>
            )}
          </div>

          {/* Course Modules from DB */}
          {modules.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {modules.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-50 rounded-xl p-5 flex items-start gap-4"
                >
                  <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-bold ${c.iconText}`}>{mod.order_index}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{mod.title}</h4>
                    {mod.description && (
                      <p className="text-sm text-slate-600 mt-1">{mod.description}</p>
                    )}
                    {mod.duration && (
                      <p className="text-xs text-slate-500 mt-1">{mod.duration}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : program?.what_you_learn && program.what_you_learn.length > 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 lg:p-10 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4">
                {program.what_you_learn.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <GraduationCap className={`w-5 h-5 ${c.iconText} flex-shrink-0 mt-0.5`} />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="text-center text-slate-500 py-8">
              <p>Detailed curriculum provided upon enrollment. Contact us for the full course outline.</p>
            </div>
          ) : null}

          <p className="text-sm text-slate-500 mt-6 text-center">
            Detailed curriculum provided upon enrollment. Program content may be customized per cohort.
          </p>
        </div>
      </section>

      {/* Section Image — Curriculum */}
      {config.sectionImages?.curriculum && (
        <section className="relative h-[200px] sm:h-[280px] md:h-[360px]">
          <Image
            src={config.sectionImages.curriculum.src}
            alt={config.sectionImages.curriculum.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </section>
      )}

      {/* Career Path */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block bg-white/10 ${c.dark} text-sm font-semibold px-4 py-1 rounded-full mb-4`}>
              Career Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {config.careerPath.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {config.careerPath.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-xl p-6 text-center relative"
              >
                {index < config.careerPath.steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white/30" />
                )}
                <div className={`text-3xl font-bold ${c.darkAccent} mb-2`}>{index + 1}</div>
                <h3 className="font-bold mb-1">{step.title}</h3>
                <p className={`${c.dark} font-semibold`}>{step.salary}</p>
                <p className="text-sm text-slate-500">{step.time}</p>
                <p className="text-sm text-slate-600 mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Image — Career */}
      {config.sectionImages?.career && (
        <section className="relative h-[200px] sm:h-[280px] md:h-[360px]">
          <Image
            src={config.sectionImages.career.src}
            alt={config.sectionImages.career.alt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </section>
      )}

      {/* FAQ */}
      {config.faqs.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
                Common Questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {config.faqs.map((faq, index) => (
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
                    <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5">
                      <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            {config.cta.title}
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            {config.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={config.cta.primaryHref}
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white font-semibold rounded-full hover:bg-slate-800 transition-all transform hover:scale-105 shadow-lg"
            >
              {config.cta.primaryLabel}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href={config.cta.secondaryHref}
              className={`inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-all`}
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              {config.cta.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
