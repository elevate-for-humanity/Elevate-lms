'use client';

import { motion } from 'framer-motion';

interface Skill {
  name: string;
  icon?: string;
  image?: string; // Optional real image path
  description?: string;
}

interface SkillsSectionProps {
  title?: string;
  subtitle?: string;
  skills: Skill[];
}

export function SkillsSection({
  title = "What You'll Learn",
  subtitle,
  skills,
}: SkillsSectionProps) {
  return (
    <section className="py-12 lg:py-16 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-700 text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Industry-ready skills
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </motion.div>

        {/* Skills grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {skills.map((skill, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative"
            >
              <div className="relative bg-white rounded-2xl p-5 border border-slate-100 hover:border-brand-red-200 transition-all duration-300 hover:shadow-xl hover:shadow-brand-red-500/5 hover:-translate-y-1">
                {/* Skill icon */}
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center group-hover:from-brand-red-50 group-hover:to-brand-red-100/50 transition-all duration-300 overflow-hidden">
                  {skill.image ? (
                    <img 
                      src={skill.image} 
                      alt={skill.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : skill.icon ? (
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{skill.icon}</span>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-brand-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-brand-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Skill name */}
                <h3 className="font-bold text-slate-900 text-center text-sm leading-tight group-hover:text-brand-red-600 transition-colors">
                  {skill.name}
                </h3>
                
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-red-500/0 to-amber-500/0 group-hover:from-brand-red-500/5 group-hover:to-amber-500/5 transition-all duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom accent */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 h-px bg-gradient-to-r from-transparent via-brand-red-500 to-transparent"
        />
      </div>
    </section>
  );
}

export default SkillsSection;
