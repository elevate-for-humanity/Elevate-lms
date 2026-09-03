'use client';

import { motion } from 'framer-motion';

interface JourneyStep {
  icon: string;
  title: string;
  description: string;
  image?: string; // Optional real image path
}

interface JourneySectionProps {
  title?: string;
  subtitle?: string;
  steps: JourneyStep[];
}

export function JourneySection({
  title = "Your Journey",
  subtitle,
  steps,
}: JourneySectionProps) {
  return (
    <section className="py-12 lg:py-16 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-rose-50/30" />
      
      {/* Decorative shapes */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-brand-red-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-tl from-amber-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/5 rounded-full text-slate-600 text-sm font-medium mb-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Application process
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-slate-600 max-w-xl mx-auto">{subtitle}</p>
          )}
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-red-500 via-brand-red-400 to-slate-200 md:-translate-x-1/2" />
          
          <div className="space-y-6 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              const isLast = i === steps.length - 1;
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`relative flex items-start gap-8 ${
                    isLast ? 'pb-0' : 'pb-6 md:pb-12'
                  }`}
                >
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red-500 to-brand-red-600 shadow-lg shadow-brand-red-500/30 flex items-center justify-center ring-4 ring-white overflow-hidden">
                      {step.image ? (
                        <img 
                          src={step.image} 
                          alt={step.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{step.icon}</span>
                      )}
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`flex-1 pt-2 ${
                    isLeft ? 'md:text-left md:pr-16' : 'md:absolute md:left-1/2 md:w-[calc(50%-4rem)] md:text-left md:pl-16'
                  }`}>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-red-200/50 transition-all duration-300">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">{step.description}</p>
                      
                      {/* Progress indicator */}
                      {!isLast && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                          <div className="flex-1 h-0.5 bg-slate-100 rounded" />
                          <span className="flex items-center gap-1">
                            Next: {steps[i + 1]?.title}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* End marker */}
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="absolute bottom-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg shadow-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default JourneySection;
