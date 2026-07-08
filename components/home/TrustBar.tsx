'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Award, 
  CheckCircle, 
  Building2, 
  Users, 
  GraduationCap,
  Globe,
  BadgeCheck,
  Handshake,
  Star,
  TrendingUp,
  FileBadge,
  Briefcase
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface TrustBarProps {
  variant?: 'hero' | 'section' | 'full' | 'footer';
  className?: string;
}

interface TrustItem {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  highlight?: boolean;
  category: 'government' | 'employer' | 'outcome' | 'accreditation';
}

const TRUST_ITEMS: TrustItem[] = [
  // Government & Workforce
  {
    icon: <Shield className="w-5 h-5" />,
    label: 'DOL Registered',
    sublabel: 'Apprenticeship Sponsor',
    highlight: true,
    category: 'government',
  },
  {
    icon: <BadgeCheck className="w-5 h-5" />,
    label: 'WIOA Approved',
    sublabel: 'Workforce Innovation',
    highlight: true,
    category: 'government',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    label: 'WorkOne Partner',
    sublabel: 'Indiana Workforce',
    highlight: true,
    category: 'government',
  },
  {
    icon: <Handshake className="w-5 h-5" />,
    label: 'VR Services',
    sublabel: 'Vocational Rehab Partner',
    category: 'government',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    label: 'ETPL Listed',
    sublabel: 'Eligible Training Provider',
    category: 'government',
  },
  
  // Accreditation & Credentials
  {
    icon: <FileBadge className="w-5 h-5" />,
    label: 'State Board',
    sublabel: 'Approved Program',
    highlight: true,
    category: 'accreditation',
  },
  {
    icon: <Award className="w-5 h-5" />,
    label: 'EPA 608',
    sublabel: 'Certified Training',
    category: 'accreditation',
  },
  {
    icon: <Star className="w-5 h-5" />,
    label: 'HVAC Excellence',
    sublabel: 'Industry Recognized',
    category: 'accreditation',
  },
  
  // Employer Partners
  {
    icon: <Building2 className="w-5 h-5" />,
    label: '40+ Employers',
    sublabel: 'Hiring Partners',
    highlight: true,
    category: 'employer',
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    label: 'Industry Leaders',
    sublabel: 'Corporate Partners',
    category: 'employer',
  },
  
  // Outcomes
  {
    icon: <Users className="w-5 h-5" />,
    label: '100% Funding',
    sublabel: 'Assistance Available',
    highlight: true,
    category: 'outcome',
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    label: '98% Pass Rate',
    sublabel: 'License Exam Success',
    highlight: true,
    category: 'outcome',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    label: '85% Placement',
    sublabel: 'Graduate Employment',
    category: 'outcome',
  },
];

// Hero variant - compact pills
function HeroTrustBar({ items }: { items: TrustItem[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.slice(0, 6).map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + index * 0.1 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md ${
            item.highlight
              ? 'bg-brand-red-600/90 text-white'
              : 'bg-white/90 text-slate-700'
          }`}
        >
          <span className={item.highlight ? 'text-white' : 'text-brand-red-600'}>
            {item.icon}
          </span>
          <div className="text-xs">
            <div className="font-semibold">{item.label}</div>
            {item.sublabel && (
              <div className="text-[10px] opacity-80">{item.sublabel}</div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Full variant - comprehensive grid
function FullTrustBar() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  
  const government = TRUST_ITEMS.filter(i => i.category === 'government');
  const accreditation = TRUST_ITEMS.filter(i => i.category === 'accreditation');
  const employers = TRUST_ITEMS.filter(i => i.category === 'employer');
  const outcomes = TRUST_ITEMS.filter(i => i.category === 'outcome');

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className="py-16 bg-white border-y border-slate-100"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Trusted by Government, Industry & Graduates
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Elevate partners with workforce agencies, employers, and credentialing bodies to ensure your success.
          </p>
        </motion.div>

        {/* Trust Categories */}
        <div className="grid md:grid-cols-4 gap-8">
          {/* Government & Workforce */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-3">Government & Workforce</h3>
            <div className="space-y-2">
              {government.map((item) => (
                <div key={item.label} className="flex items-center gap-2 justify-center text-sm">
                  <span className="text-brand-red-600">{item.icon}</span>
                  <span className="text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Accreditation & Credentials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-3">Accreditation</h3>
            <div className="space-y-2">
              {accreditation.map((item) => (
                <div key={item.label} className="flex items-center gap-2 justify-center text-sm">
                  <span className="text-brand-red-600">{item.icon}</span>
                  <span className="text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Employer Partners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-3">Employer Partners</h3>
            <div className="space-y-2">
              {employers.map((item) => (
                <div key={item.label} className="flex items-center gap-2 justify-center text-sm">
                  <span className="text-brand-red-600">{item.icon}</span>
                  <span className="text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Outcomes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-3">Graduate Outcomes</h3>
            <div className="space-y-2">
              {outcomes.map((item) => (
                <div key={item.label} className="flex items-center gap-2 justify-center text-sm">
                  <span className="text-brand-red-600">{item.icon}</span>
                  <span className="text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Section variant - horizontal scroll
function SectionTrustBar() {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-8">
      {TRUST_ITEMS.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-2"
        >
          <span className="text-brand-red-600">{item.icon}</span>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
            {item.sublabel && (
              <p className="text-xs text-slate-500">{item.sublabel}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Footer variant - minimal
function FooterTrustBar() {
  const topItems = TRUST_ITEMS.slice(0, 4);
  
  return (
    <div className="flex flex-wrap justify-center gap-6 py-4">
      {topItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-slate-400 text-sm">
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TrustBar({ variant = 'section', className = '' }: TrustBarProps) {
  if (variant === 'hero') {
    return (
      <div className={className}>
        <HeroTrustBar items={TRUST_ITEMS} />
      </div>
    );
  }
  
  if (variant === 'full') {
    return <FullTrustBar />;
  }
  
  if (variant === 'footer') {
    return (
      <div className={className}>
        <FooterTrustBar />
      </div>
    );
  }
  
  return (
    <div className={className}>
      <SectionTrustBar />
    </div>
  );
}

export default TrustBar;
