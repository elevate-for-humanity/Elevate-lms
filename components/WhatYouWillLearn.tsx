"use client";


interface WhatYouWillLearnProps {
  items: string[];
  title?: string;
  className?: string;
}

export function WhatYouWillLearn({
  items,
  title = "What you'll learn",
  className = ''
}: WhatYouWillLearnProps) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-6 md:p-8 ${className}`}>
      <h2 className="text-2xl font-bold text-black mb-6">{title}</h2>
      <ul className="grid md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="text-black text-sm leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

interface SkillsYouWillGainProps {
  skills: string[];
  className?: string;
}

export function SkillsYouWillGain({ skills, className = '' }: SkillsYouWillGainProps) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 p-6 md:p-8 ${className}`}>
      <h2 className="text-2xl font-bold text-black mb-6">Skills you'll gain</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium border border-red-200 hover:bg-red-100 transition"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}
