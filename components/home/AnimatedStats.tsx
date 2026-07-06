'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAnimatedCounter, useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  description?: string;
}

interface AnimatedStatsProps {
  stats: StatItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  dark?: boolean;
}

function StatCard({ 
  stat, 
  index, 
  dark 
}: { 
  stat: StatItem; 
  index: number;
  dark: boolean;
}) {
  const { ref, displayValue } = useAnimatedCounter({
    end: stat.value,
    duration: 2500,
    prefix: stat.prefix || '',
    suffix: stat.suffix || '+',
    decimals: stat.value % 1 !== 0 ? 1 : 0,
  });

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`text-center p-6 rounded-2xl ${
        dark 
          ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
          : 'bg-white shadow-lg border border-slate-100'
      }`}
    >
      <motion.div
        className={`text-4xl sm:text-5xl font-extrabold mb-2 ${
          dark ? 'text-white' : 'text-slate-900'
        }`}
      >
        {displayValue}
      </motion.div>
      <div className={`text-lg font-semibold mb-1 ${dark ? 'text-brand-red-400' : 'text-brand-red-600'}`}>
        {stat.label}
      </div>
      {stat.description && (
        <div className={`text-sm ${dark ? 'text-white/70' : 'text-slate-500'}`}>
          {stat.description}
        </div>
      )}
    </motion.div>
  );
}

export function AnimatedStats({
  stats,
  title,
  subtitle,
  className = '',
  dark = false,
}: AnimatedStatsProps) {
  const { ref: titleRef, isVisible } = useScrollAnimation(0);

  return (
    <section className={`py-16 sm:py-20 ${dark ? 'bg-slate-900' : 'bg-slate-50'} ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        {(title || subtitle) && (
          <motion.div
            ref={titleRef as React.RefObject<HTMLDivElement>}
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {title && (
              <h2 className={`text-3xl sm:text-4xl font-extrabold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`text-lg max-w-2xl mx-auto ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} dark={dark} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Success metrics with icons for outcomes section
interface SuccessMetric {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  label: string;
}

interface SuccessMetricsProps {
  metrics: SuccessMetric[];
  className?: string;
}

// Helper component to call hook for each metric
function MetricCard({ metric, index }: { metric: SuccessMetric; index: number }) {
  const { ref, displayValue } = useAnimatedCounter({
    end: metric.value,
    duration: 2000,
    suffix: metric.suffix || '%',
  });

  return (
    <motion.div
      key={metric.label}
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 text-center hover:shadow-xl transition-shadow"
    >
      <div className="w-14 h-14 bg-brand-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-brand-red-600">
        {metric.icon}
      </div>
      <div className="text-3xl font-extrabold text-slate-900 mb-2">
        {displayValue}
      </div>
      <div className="text-slate-600 font-medium">{metric.label}</div>
    </motion.div>
  );
}

export function SuccessMetrics({ metrics, className = '' }: SuccessMetricsProps) {
  return (
    <section className={`py-16 sm:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default AnimatedStats;
