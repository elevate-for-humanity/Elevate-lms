'use client';

import { motion } from 'framer-motion';

interface Skill {
  name: string;
  icon?: string;
}

interface SkillsSectionProps {
  title?: string;
  subtitle?: string;
  skills: Skill[];
}

export function SkillsSection({
  title = "What You'll Learn",
  subtitle = "Skills that employers value and clients trust",
  skills,
}: SkillsSectionProps) {
  return (
    <section className="py-20 bg-slate-50 px-4">
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
          {subtitle && (
            <p className="text-lg text-slate-600">{subtitle}</p>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {skills.map((skill, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-6 text-center border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all"
            >
              {skill.icon && (
                <span className="text-4xl mb-3 block">{skill.icon}</span>
              )}
              <p className="font-semibold text-slate-900 text-sm">{skill.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SkillsSection;
