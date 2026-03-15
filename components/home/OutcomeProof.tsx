'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { TrendingUp, Clock, Award, DollarSign } from 'lucide-react';

const OUTCOMES = [
  {
    program: 'CNA Certification',
    duration: '6 weeks',
    beforeWage: 'Unemployed',
    afterWage: '$35,000–$42,000/yr',
    quote: 'I went from no income to a full-time hospital job in under two months. The funding covered everything.',
    name: 'Program Graduate',
    credential: 'Certified Nursing Assistant',
  },
  {
    program: 'CDL Class A',
    duration: '8 weeks',
    beforeWage: '$24,000/yr',
    afterWage: '$55,000–$72,000/yr',
    quote: 'I doubled my income. The CDL program had me driving within 8 weeks and I had three job offers before I finished.',
    name: 'Program Graduate',
    credential: 'Commercial Driver License — Class A',
  },
  {
    program: 'HVAC Technician',
    duration: '12 weeks',
    beforeWage: '$28,000/yr',
    afterWage: '$45,000–$65,000/yr',
    quote: 'Went from retail to a union HVAC job. The apprenticeship model meant I was earning while learning.',
    name: 'Program Graduate',
    credential: 'EPA 608 Universal Certification',
  },
];

const AGGREGATE_STATS = [
  { value: 85, suffix: '%', label: 'Job placement within 90 days', icon: TrendingUp },
  { value: 12, suffix: ' weeks', label: 'Average time to credential', icon: Clock },
  { value: 42, prefix: '$', suffix: 'K', label: 'Average starting salary', icon: DollarSign },
  { value: 100, suffix: '%', label: 'Tuition covered for eligible students', icon: Award },
];

export default function OutcomeProof() {
  return (
    <section className="py-20 sm:py-28 bg-slate-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-blue-400 uppercase tracking-wider mb-3">
              Measured Outcomes
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4">
              Real careers. Real numbers.
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Every metric is tracked. Every outcome is documented. This is what workforce infrastructure delivers.
            </p>
          </div>
        </ScrollReveal>

        {/* Aggregate stats */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {AGGREGATE_STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                  <Icon className="w-8 h-8 text-brand-blue-400 mx-auto mb-3" />
                  <p className="text-4xl font-extrabold">
                    <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-sm text-slate-400 mt-2">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        {/* Trajectory testimonials */}
        <div className="grid lg:grid-cols-3 gap-8">
          {OUTCOMES.map((outcome, i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-colors h-full flex flex-col">
                {/* Trajectory arrow */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="px-3 py-1.5 bg-white/20 text-brand-red-400 rounded-lg text-sm font-medium">
                    {outcome.beforeWage}
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <div className="px-3 py-1.5 bg-white/20 text-emerald-400 rounded-lg text-sm font-bold">
                    {outcome.afterWage}
                  </div>
                </div>

                <p className="text-lg text-white/80 mb-6 flex-1 italic">
                  &ldquo;{outcome.quote}&rdquo;
                </p>

                <div className="border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">{outcome.name}</p>
                  <p className="text-sm text-slate-400">{outcome.program} &middot; {outcome.duration}</p>
                  <p className="text-xs text-brand-blue-400 mt-1">{outcome.credential}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
