'use client';

import { motion } from 'framer-motion';

interface JourneyStep {
  icon: string;
  title: string;
  description: string;
}

interface JourneySectionProps {
  title?: string;
  steps: JourneyStep[];
}

export function JourneySection({
  title = "Your Journey",
  steps,
}: JourneySectionProps) {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            {title}
          </h2>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2" />

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative md:grid md:grid-cols-2 md:gap-8 ${
                  i % 2 === 0 ? '' : 'md:flex-row-reverse'
                }`}
              >
                <div className={`flex items-start gap-6 ${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:order-2 md:text-left md:pl-12'}`}>
                  {/* Icon */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-brand-red-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-sm font-semibold rounded-full mb-2">
                      Step {i + 1}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </div>
                <div className="hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default JourneySection;
