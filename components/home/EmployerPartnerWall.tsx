'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Truck, Heart, Wrench, Scissors, Stethoscope, GraduationCap, Award } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface EmployerPartnerWallProps {
  className?: string;
}

interface Partner {
  id: string;
  name: string;
  category: 'healthcare' | 'trades' | 'retail' | 'logistics' | 'hospitality';
  logo?: string;
  placeholder?: string;
  hiring?: string;
}

const PARTNERS: Partner[] = [
  // Healthcare
  { id: '1', name: 'Community Health Network', category: 'healthcare', hiring: 'CNA, Med Aide' },
  { id: '2', name: 'Franciscan Health', category: 'healthcare', hiring: 'CNA, Support' },
  { id: '3', name: 'Eskenazi Health', category: 'healthcare', hiring: 'CNA, Admin' },
  { id: '4', name: 'IU Health', category: 'healthcare', hiring: 'CNA, Tech' },
  
  // Trades
  { id: '5', name: 'Heaney Heating & Cooling', category: 'trades', hiring: 'HVAC Techs' },
  { id: '6', name: 'Excel Electric', category: 'trades', hiring: 'Apprentices' },
  { id: '7', name: 'Renaissance Barber', category: 'retail', hiring: 'Barbers' },
  { id: '8', name: 'Styles & Smiles', category: 'retail', hiring: 'Barbers' },
  
  // Logistics
  { id: '9', name: 'Werner Enterprises', category: 'logistics', hiring: 'CDL Drivers' },
  { id: '10', name: 'Schneider National', category: 'logistics', hiring: 'CDL Drivers' },
  { id: '11', name: 'Meijer Distribution', category: 'logistics', hiring: 'Drivers, Tech' },
  { id: '12', name: 'FedEx', category: 'logistics', hiring: 'CDL, Package' },
  
  // Hospitality & Retail
  { id: '13', name: 'Great Clips', category: 'retail', hiring: 'Barbers, Stylists' },
  { id: '14', name: 'Sport Clips', category: 'retail', hiring: 'Barbers' },
  { id: '15', name: 'Hotel Unity', category: 'hospitality', hiring: 'Various' },
  { id: '16', name: 'Marriott', category: 'hospitality', hiring: 'Service' },
];

const CATEGORY_CONFIG = {
  healthcare: { icon: Heart, color: 'bg-emerald-100 text-emerald-600', label: 'Healthcare' },
  trades: { icon: Wrench, color: 'bg-amber-100 text-amber-600', label: 'Skilled Trades' },
  retail: { icon: Scissors, color: 'bg-purple-100 text-purple-600', label: 'Barber & Beauty' },
  logistics: { icon: Truck, color: 'bg-blue-100 text-blue-600', label: 'Logistics' },
  hospitality: { icon: Building2, color: 'bg-slate-100 text-slate-600', label: 'Hospitality' },
};

function PartnerLogo({ partner, index }: { partner: Partner; index: number }) {
  const config = CATEGORY_CONFIG[partner.category];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-brand-red-200 transition-all group"
    >
      {/* Logo placeholder with icon */}
      <div className="flex flex-col items-center justify-center h-20 mb-3">
        <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center mb-2`}>
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-700 text-center line-clamp-2 group-hover:text-brand-red-600 transition-colors">
          {partner.name}
        </p>
      </div>
      
      {/* Hiring badge */}
      {partner.hiring && (
        <div className="text-center">
          <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
            Hiring: {partner.hiring}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function CategoryFilter({ 
  activeCategory, 
  onCategoryChange 
}: { 
  activeCategory: string | null; 
  onCategoryChange: (cat: string | null) => void;
}) {
  const categories = [
    { key: null, label: 'All Partners' },
    ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
      key,
      label: config.label,
    })),
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {categories.map((cat) => (
        <button
          key={cat.key || 'all'}
          onClick={() => onCategoryChange(cat.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeCategory === cat.key
              ? 'bg-brand-red-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export function EmployerPartnerWall({ className = '' }: EmployerPartnerWallProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredPartners = activeCategory
    ? PARTNERS.filter(p => p.category === activeCategory)
    : PARTNERS;

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-slate-50 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 border border-brand-red-200 rounded-full text-brand-red-700 text-sm font-medium mb-4">
            <Building2 className="w-4 h-4" />
            Employer Partners
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            40+ Employers Ready to Hire
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Our employer partnerships mean you're not just earning a credential—you're earning a job offer.
            Many employers sponsor our students through their apprenticeships.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-brand-red-600">40+</p>
            <p className="text-sm text-slate-600">Hiring Partners</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-brand-red-600">85%</p>
            <p className="text-sm text-slate-600">Placement Rate</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-brand-red-600">3</p>
            <p className="text-sm text-slate-600">Industries</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-brand-red-600">100%</p>
            <p className="text-sm text-slate-600">Employer Screening</p>
          </div>
        </motion.div>

        {/* Filter */}
        <CategoryFilter 
          activeCategory={activeCategory} 
          onCategoryChange={setActiveCategory} 
        />

        {/* Partner Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredPartners.map((partner, index) => (
            <PartnerLogo key={partner.id} partner={partner} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <p className="text-slate-600 mb-4">
            Are you an employer looking to partner with Elevate?
          </p>
          <a
            href="/employers"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Partner With Us
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default EmployerPartnerWall;
