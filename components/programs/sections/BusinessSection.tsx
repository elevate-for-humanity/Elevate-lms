'use client';

import { motion } from 'framer-motion';
import { Check, TrendingUp } from 'lucide-react';

interface BusinessSectionProps {
  title?: string;
  subtitle?: string;
  items: string[];
  imageSrc?: string;
  imageAlt?: string;
}

export function BusinessSection({
  title = "Build Your Own Business",
  subtitle = "Your license is just the beginning.",
  items,
  imageSrc,
  imageAlt = "Business success",
}: BusinessSectionProps) {
  return (
    <section className="py-12 lg:py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">
              Entrepreneurship
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              {title}
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              {subtitle}
            </p>
            
            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          {imageSrc && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export default BusinessSection;
