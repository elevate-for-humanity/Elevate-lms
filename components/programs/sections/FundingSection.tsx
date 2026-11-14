'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface FundingOption {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

interface FundingSectionProps {
  title?: string;
  subtitle?: string;
  options: FundingOption[];
  eligibilityCta?: { label: string; href: string };
}

export function FundingSection({
  title = "Funding Your Future",
  subtitle = "Multiple paths to affordable education",
  options,
  eligibilityCta = { label: "Check Your Eligibility", href: "/check-eligibility" },
}: FundingSectionProps) {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-brand-blue-900 to-slate-900 text-white px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {title}
          </h2>
          <p className="text-lg text-white/80">{subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {options.map((option, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
            >
              <span className="text-4xl mb-4 block">{option.icon}</span>
              <h3 className="text-xl font-bold mb-2">{option.title}</h3>
              <p className="text-white/80 text-sm mb-4">{option.description}</p>
              {option.ctaHref && (
                <Link
                  href={option.ctaHref}
                  className="inline-block text-sm font-semibold text-amber-400 hover:text-amber-300"
                >
                  {option.ctaLabel || "Learn more"} →
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {eligibilityCta && (
          <div className="text-center mt-10">
            <Link
              href={eligibilityCta.href}
              className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-lg transition-colors"
            >
              {eligibilityCta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default FundingSection;
