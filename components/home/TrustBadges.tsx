'use client';

import { motion } from 'framer-motion';
import { Shield, Award, CheckCircle, Building2, Users, GraduationCap } from 'lucide-react';

interface TrustBadge {
  icon: React.ReactNode;
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
    icon: <Shield className="w-5 h-5" />,
    label: 'DOL Registered',
    sublabel: 'Apprenticeship Sponsor',
    highlight: true,
  },
  {
    icon: <Award className="w-5 h-5" />,
    label: 'WIOA Approved',
    sublabel: 'Training Provider',
    highlight: true,
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'ETPL Listed',
    sublabel: 'Eligible Training Provider',
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    label: '40+ Employers',
    sublabel: 'Hiring Partners',
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: '2,000+ Graduates',
    sublabel: 'Successfully Placed',
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
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
    <span className={badge.highlight ? 'text-white' : 'text-brand-red-600'}>
      {badge.icon}
    </span>
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
            <span className="text-brand-red-400 mb-2">{badge.icon}</span>
            <div className="text-white font-semibold text-sm">{badge.label}</div>
            {badge.sublabel && (
              <div className="text-white/60 text-xs">{badge.sublabel}</div>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  // Section variant - horizontal row
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
          {badge.icon}
          <span className="font-semibold text-sm">{badge.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

export default TrustBadges;
