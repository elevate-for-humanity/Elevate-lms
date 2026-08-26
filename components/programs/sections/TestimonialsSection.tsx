'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Testimonial {
  name: string;
  program: string;
  quote: string;
  photo: string;
  before: string;
  after: string;
}

interface TestimonialsSectionProps {
  title?: string;
  testimonials: Testimonial[];
}

export function TestimonialsSection({
  title = "Student Success Stories",
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-12 lg:py-16 px-4 bg-white">
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
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((story, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200"
            >
              <div className="relative h-48">
                <Image src={story.photo} alt={story.name} fill className="object-cover" sizes="100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>
              <div className="p-6">
                <p className="text-sm text-brand-red-600 font-semibold mb-2">{story.program}</p>
                <p className="text-lg text-slate-900 mb-4">"{story.quote}"</p>
                <div className="pt-4 border-t">
                  <p className="font-bold text-slate-900">{story.name}</p>
                  <p className="text-sm text-slate-600">Before: {story.before}</p>
                  <p className="text-sm text-green-600 font-medium">After: {story.after}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
