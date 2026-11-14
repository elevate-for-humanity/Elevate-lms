'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ComparisonItem {
  text: string;
  positive?: boolean;
}

interface ComparisonSectionProps {
  title?: string;
  subtitle?: string;
  traditionalLabel?: string;
  apprenticeshipLabel?: string;
  traditionalItems: ComparisonItem[];
  apprenticeshipItems: ComparisonItem[];
}

export function ComparisonSection({
  title = "Why Choose an Apprenticeship?",
  subtitle = "The best way to learn a trade is by doing the trade.",
  traditionalLabel = "Traditional Beauty School",
  apprenticeshipLabel = "Elevate Apprenticeship",
  traditionalItems,
  apprenticeshipItems,
}: ComparisonSectionProps) {
  return (
    <section className="py-12 lg:py-16 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            {title}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">{traditionalLabel}</h3>
            <div className="space-y-4">
              {traditionalItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-slate-600">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Apprenticeship */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-xl font-bold text-white mb-6">{apprenticeshipLabel}</h3>
            <div className="space-y-4">
              {apprenticeshipItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ComparisonSection;
