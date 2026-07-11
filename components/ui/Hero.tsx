'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface HeroCTA {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface HeroProps {
  title: string;
  subtitle?: string;
  image: string;
  imageAlt?: string;
  ctas?: HeroCTA[];
  badge?: string;
  overlayClassName?: string;
}

export function Hero({
  title,
  subtitle,
  image,
  imageAlt = 'Hero image',
  ctas = [],
  badge,
  overlayClassName = '',
}: HeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Image */}
      <div className="relative h-[clamp(200px,40vw,500px)] w-full">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50 ${overlayClassName}`} />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl"
          >
            {badge && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="inline-block px-4 py-1.5 bg-brand-red-600 text-white text-sm font-bold rounded-full mb-4"
              >
                {badge}
              </motion.span>
            )}
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl">
                {subtitle}
              </p>
            )}

            {ctas.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {ctas.map((cta, index) => (
                  <motion.div
                    key={cta.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1), duration: 0.4 }}
                  >
                    <Link
                      href={cta.href}
                      className={`
                        inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all
                        ${
                          cta.variant === 'primary'
                            ? 'bg-brand-red-600 text-white hover:bg-brand-red-700 hover:-translate-y-0.5 shadow-lg'
                            : cta.variant === 'outline'
                            ? 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 hover:-translate-y-0.5'
                            : 'bg-white text-slate-900 hover:bg-slate-100 hover:-translate-y-0.5 shadow-lg'
                        }
                      `}
                    >
                      {cta.label}
                      {cta.variant !== 'outline' && <ArrowRight className="w-4 h-4" />}
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Product Hero - For store product pages
interface ProductHeroProps {
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  rating?: { stars: number; reviews: number };
}

export function ProductHero({
  title,
  subtitle,
  image,
  badge,
  rating,
}: ProductHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-brand-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-red-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {badge && (
              <span className="inline-block px-3 py-1 bg-brand-red-600 text-white text-xs font-bold rounded-full mb-4">
                {badge}
              </span>
            )}
            
            {rating && (
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= rating.stars ? 'text-yellow-400' : 'text-slate-600'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-slate-300 ml-1">({rating.reviews} reviews)</span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              {title}
            </h1>
            
            <p className="text-xl text-slate-300 mb-8">
              {subtitle}
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
