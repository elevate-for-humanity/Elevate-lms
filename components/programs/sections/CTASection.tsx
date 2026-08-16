'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  ctas: Array<{
    label: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
  videoSrc?: string;
  videoPoster?: string;
}

export function CTASection({
  title = "Your Future Starts Here",
  subtitle,
  ctas,
  videoSrc,
  videoPoster,
}: CTASectionProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {videoSrc ? (
          <SafeHeroVideo
            src={videoSrc}
            poster={videoPoster || '/images/og-default.jpg'}
            className="absolute inset-0 h-full w-full object-cover"
            ariaLabel="Program call to action video"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            {ctas.map((cta, i) => (
              <Link
                key={i}
                href={cta.href}
                className={`px-8 py-4 font-bold rounded-lg text-lg transition-colors ${
                  cta.variant === 'primary'
                    ? 'bg-white text-slate-900 hover:bg-slate-100'
                    : cta.variant === 'secondary'
                    ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                    : 'bg-white/10 hover:bg-white/20 border border-white/30'
                }`}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
