'use client';

import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

interface EmployerLogo {
  name: string;
  logo?: string;
}

interface AnimatedLogoStripProps {
  title?: string;
  subtitle?: string;
  employers?: EmployerLogo[];
  className?: string;
}

const DEFAULT_EMPLOYERS: EmployerLogo[] = [
  { name: 'Great Clips' },
  { name: 'Sport Clips' },
  { name: 'Supercuts' },
  { name: 'Floyd\'s 99' },
  { name: 'European Wax Center' },
  { name: 'Regis Salons' },
  { name: 'Smart Style' },
  { name: 'Cost Cutters' },
];

const LogoItem = ({ employer, index }: { employer: EmployerLogo; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    className="flex-shrink-0 px-8 py-4 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center min-w-[160px] hover:shadow-lg hover:border-brand-red-200 transition-all duration-300"
  >
    {employer.logo ? (
      <img
        src={employer.logo}
        alt={`${employer.name} logo`}
        className="h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
      />
    ) : (
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-brand-red-600" />
        <span className="font-semibold text-slate-700 text-sm">{employer.name}</span>
      </div>
    )}
  </motion.div>
);

export function AnimatedLogoStrip({
  title = 'Our Employer Partners',
  subtitle = 'Talent hired by leading industry employers',
  employers = DEFAULT_EMPLOYERS,
  className = '',
}: AnimatedLogoStripProps) {
  return (
    <section className={`py-16 bg-slate-50 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600">{subtitle}</p>
        </motion.div>

        {/* Scrolling Logo Strip */}
        <div className="relative overflow-hidden">
          {/* Fade gradients */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          {/* Animated Strip */}
          <motion.div
            className="flex gap-6"
            animate={{ x: [0, -500] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: 30,
                ease: 'linear',
              },
            }}
          >
            {/* First set */}
            {employers.map((employer, index) => (
              <LogoItem key={`first-${employer.name}`} employer={employer} index={index} />
            ))}
            {/* Duplicate for seamless loop */}
            {employers.map((employer, index) => (
              <LogoItem key={`second-${employer.name}`} employer={employer} index={index} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Partner logos with different styling
interface PartnerLogoStripProps {
  variant?: 'dark' | 'light';
  className?: string;
}

export function PartnerLogoStrip({ variant = 'light', className = '' }: PartnerLogoStripProps) {
  const isDark = variant === 'dark';
  
  const partners = [
    { name: 'WorkOne Indiana', type: 'government' },
    { name: 'Indiana DWD', type: 'government' },
    { name: 'WIOA', type: 'funding' },
    { name: 'Workforce Ready', type: 'funding' },
    { name: 'FSSA', type: 'government' },
    { name: 'DOL', type: 'government' },
  ];

  return (
    <section className={`py-12 ${isDark ? 'bg-slate-800' : 'bg-white'} ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Trusted By Government & Workforce Agencies
          </h4>
        </motion.div>

        <div className="flex flex-wrap justify-center items-center gap-8">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl ${
                isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Building2 className={`w-5 h-5 ${isDark ? 'text-brand-red-400' : 'text-brand-red-600'}`} />
              <span className="font-medium">{partner.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AnimatedLogoStrip;
