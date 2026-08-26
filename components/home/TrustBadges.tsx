'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface TrustBadge {
  img: string;
  imgAlt: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
}

interface TrustBadgesProps {
  variant?: 'hero' | 'section' | 'footer';
  className?: string;
}

const BADGES: TrustBadge[] = [
  {
    img: '/images/pages/about-hero.webp',
    imgAlt: 'Department of Labor Registered Apprenticeship Sponsor Badge',
    label: 'DOL Registered',
    sublabel: 'Apprenticeship Sponsor',
    highlight: true,
  },
  {
    img: '/images/pages/wioa-meeting.webp',
    imgAlt: 'WIOA Approved Training Provider Badge',
    label: 'WIOA Approved',
    sublabel: 'Training Provider',
    highlight: true,
  },
  {
    img: '/images/pages/credential-partners-hero.webp',
    imgAlt: 'ETPL Eligible Training Provider Badge',
    label: 'ETPL Listed',
    sublabel: 'Eligible Training Provider',
  },
  {
    img: '/images/pages/hire-graduates-page-1.webp',
    imgAlt: '40+ Employer Hiring Partners',
    label: '40+ Employers',
    sublabel: 'Hiring Partners',
  },
  {
    img: '/images/pages/certifications-page-1.webp',
    imgAlt: 'Industry Credentials',
    label: 'Industry Credentials',
    sublabel: 'Licensed Training',
  },
  {
    img: '/images/pages/certifications.webp',
    imgAlt: '98% License Exam Pass Rate',
    label: '98% Pass Rate',
    sublabel: 'License Exam Success',
    highlight: true,
  },
];

const HeroBadge = ({ badge, index }: { badge: TrustBadge; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md ${
      badge.highlight
        ? 'bg-brand-red-600/90 text-white'
        : 'bg-white/90 text-slate-700'
    }`}
  >
    <Image
      src={badge.img}
      alt={badge.imgAlt}
      width={20}
      height={20}
      className="object-contain" sizes="(max-width: 768px) 100vw, 50vw"
    />
    <div className="text-xs">
      <div className="font-semibold">{badge.label}</div>
      {badge.sublabel && (
        <div className="text-[10px] opacity-80">{badge.sublabel}</div>
      )}
    </div>
  </motion.div>
);

export function TrustBadges({ variant = 'section', className = '' }: TrustBadgesProps) {
  if (variant === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className={`flex flex-wrap justify-center gap-3 mt-8 ${className}`}
      >
        {BADGES.map((badge, index) => (
          <HeroBadge key={badge.label} badge={badge} index={index} />
        ))}
      </motion.div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 ${className}`}>
        {BADGES.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center text-center p-4 bg-white/10 rounded-xl border border-white/10"
          >
            <div className="relative w-12 h-12 mb-2">
              <Image
                src={badge.img}
                alt={badge.imgAlt}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
            <div className="text-white font-semibold text-sm">{badge.label}</div>
            {badge.sublabel && (
              <div className="text-white/60 text-xs">{badge.sublabel}</div>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  // Section variant - horizontal row with images
  return (
    <div className={`flex flex-wrap justify-center gap-6 ${className}`}>
      {BADGES.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-center gap-2 ${
            badge.highlight ? 'text-brand-red-600' : 'text-slate-600'
          }`}
        >
          <Image
            src={badge.img}
            alt={badge.imgAlt}
            width={24}
            height={24}
            className="object-contain" sizes="(max-width: 768px) 100vw, 50vw"
          />
          <span className="font-semibold text-sm">{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default TrustBadges;
