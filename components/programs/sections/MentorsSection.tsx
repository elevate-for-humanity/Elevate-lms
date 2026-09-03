'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Mentor {
  name: string;
  role: string;
  photo: string;
  bio: string;
  credentials: string[];
}

interface MentorsSectionProps {
  title?: string;
  subtitle?: string;
  mentors: Mentor[];
}

export function MentorsSection({
  title = "Meet Your Mentors",
  subtitle = "Learn from industry professionals",
  mentors,
}: MentorsSectionProps) {
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
          <p className="text-lg text-slate-600">{subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {mentors.map((mentor, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200"
            >
              <div className="relative h-64">
                <Image
                  src={mentor.photo}
                  alt={mentor.name}
                  fill
                  className="object-cover" sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{mentor.name}</h3>
                <p className="text-sm text-brand-red-600 font-medium mb-3">{mentor.role}</p>
                <p className="text-sm text-slate-600 mb-4">{mentor.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {mentor.credentials.map((cred, j) => (
                    <span key={j} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {cred}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MentorsSection;
