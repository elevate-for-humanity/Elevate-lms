'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ImagineSectionProps {
  title?: string;
  scenarios: string[];
}

export function ImagineSection({
  title = "Imagine Yourself Here",
  scenarios = [
    "Imagine walking into your salon on your very first day. Your mentor welcomes you. Clients begin arriving.",
    "Week after week your skills improve. Month after month your clientele grows.",
    "By graduation you won't just have classroom experience—you'll already have worked with real clients inside a professional salon.",
  ],
}: ImagineSectionProps) {
  return (
    <section className="py-12 lg:py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 text-center">
            {title}
          </h2>
          
          <div className="space-y-6">
            {scenarios.map((scenario, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start"
              >
                <div className="w-8 h-8 rounded-full bg-brand-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg text-slate-700 leading-relaxed">{scenario}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl text-slate-900 font-medium italic">
              That's the power of apprenticeship.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ImagineSection;
