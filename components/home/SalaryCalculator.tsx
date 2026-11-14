'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, MapPin, Briefcase, Clock, Award } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface SalaryCalculatorProps {
  className?: string;
}

interface ProgramSalary {
  name: string;
  title: string;
  entry: number;
  mid: number;
  senior: number;
  top: number;
  growth: string;
  outlook: string;
  locations: string[];
}

const SALARY_DATA: ProgramSalary[] = [
  {
    name: 'Barbering',
    title: 'Professional Barber',
    entry: 35000,
    mid: 45000,
    senior: 55000,
    top: 75000,
    growth: '12%',
    outlook: 'Growing demand for licensed barbers in Indiana',
    locations: ['Indianapolis', 'Fort Wayne', 'Carmel', 'Bloomington'],
  },
  {
    name: 'HVAC',
    title: 'HVAC Technician',
    entry: 42000,
    mid: 55000,
    senior: 68000,
    top: 85000,
    growth: '15%',
    outlook: 'High demand due to new construction and retrofitting',
    locations: ['Indianapolis', 'Carmel', 'Fishers', 'Noblesville'],
  },
  {
    name: 'CNA/Med Aide',
    title: 'Certified Nursing Assistant',
    entry: 30000,
    mid: 38000,
    senior: 45000,
    top: 52000,
    growth: '8%',
    outlook: 'Growing healthcare sector in Indiana',
    locations: ['Indianapolis', 'South Bend', 'Evansville', 'Carmel'],
  },
  {
    name: 'CDL',
    title: 'Commercial Truck Driver',
    entry: 50000,
    mid: 62000,
    senior: 75000,
    top: 90000,
    growth: '10%',
    outlook: 'Nationwide driver shortage creating opportunities',
    locations: ['Indianapolis', 'Gary', 'Fort Wayne', 'Lafayette'],
  },
  {
    name: 'Medical Billing',
    title: 'Medical Billing Specialist',
    entry: 34000,
    mid: 42000,
    senior: 52000,
    top: 65000,
    growth: '13%',
    outlook: 'Healthcare administration growth',
    locations: ['Indianapolis', 'Carmel', 'Bloomington', 'Muncie'],
  },
];

export function SalaryCalculator({ className = '' }: SalaryCalculatorProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [selectedProgram, setSelectedProgram] = useState(SALARY_DATA[0]);
  const [experienceYears, setExperienceYears] = useState(2);

  const getSalaryLevel = (years: number): number => {
    if (years < 1) return selectedProgram.entry;
    if (years < 3) return selectedProgram.entry + (selectedProgram.mid - selectedProgram.entry) * 0.3;
    if (years < 5) return selectedProgram.entry + (selectedProgram.mid - selectedProgram.entry) * 0.7;
    if (years < 10) return selectedProgram.mid + (selectedProgram.senior - selectedProgram.mid) * 0.5;
    return selectedProgram.senior + (selectedProgram.top - selectedProgram.senior) * 0.5;
  };

  const currentSalary = Math.round(getSalaryLevel(experienceYears));
  const yearlyGrowth = Math.round(currentSalary * 0.03);
  const monthlySalary = Math.round(currentSalary / 12);
  const weeklySalary = Math.round(currentSalary / 52);

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
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-4">
            <DollarSign className="w-4 h-4" />
            Salary Insights
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            What Can You Earn?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Explore salary ranges for different career paths. Most graduates see significant salary increases within their first 2 years.
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="grid lg:grid-cols-5">
            {/* Program List */}
            <div className="lg:col-span-2 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-red-600" />
                Select Career Path
              </h3>
              <div className="space-y-2">
                {SALARY_DATA.map((program) => (
                  <button
                    key={program.name}
                    onClick={() => setSelectedProgram(program)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedProgram.name === program.name
                        ? 'bg-brand-red-600 text-white shadow-lg'
                        : 'bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className={`font-semibold ${selectedProgram.name === program.name ? 'text-white' : 'text-slate-900'}`}>
                      {program.name}
                    </div>
                    <div className={`text-sm ${selectedProgram.name === program.name ? 'text-white/80' : 'text-slate-500'}`}>
                      {program.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Salary Display */}
            <div className="lg:col-span-3 p-6">
              {/* Main Salary */}
              <div className="text-center mb-8">
                <p className="text-slate-500 mb-2">Estimated Annual Salary</p>
                <motion.p
                  key={currentSalary}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-5xl sm:text-6xl font-extrabold text-slate-900"
                >
                  ${currentSalary.toLocaleString()}
                </motion.p>
                <p className="text-slate-500 mt-2">per year</p>
              </div>

              {/* Experience Slider */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Years of Experience: {experienceYears} {experienceYears === 1 ? 'year' : 'years'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Entry</span>
                  <span>5 yrs</span>
                  <span>10+ yrs</span>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Per Month</p>
                  <p className="text-lg font-bold text-slate-900">${monthlySalary.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Per Week</p>
                  <p className="text-lg font-bold text-slate-900">${weeklySalary.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Annual Growth</p>
                  <p className="text-lg font-bold text-emerald-600">+${yearlyGrowth.toLocaleString()}</p>
                </div>
              </div>

              {/* Career Progression */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-red-600" />
                  Career Progression
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Entry Level (0-1 yr)</span>
                    <span className="font-semibold text-slate-900">${selectedProgram.entry.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-red-600 rounded-full transition-all"
                      style={{ width: `${(selectedProgram.entry / selectedProgram.top) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Mid Career (3-5 yrs)</span>
                    <span className="font-semibold text-slate-900">${selectedProgram.mid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Experienced (5-10 yrs)</span>
                    <span className="font-semibold text-slate-900">${selectedProgram.senior.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Senior (10+ yrs)</span>
                    <span className="font-bold text-brand-red-600">${selectedProgram.top.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Job Outlook */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Award className="w-4 h-4 text-emerald-500" />
                  {selectedProgram.growth} job growth
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {selectedProgram.locations.slice(0, 2).join(', ')}
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-4">
                <Clock className="w-4 h-4 inline mr-1" />
                {selectedProgram.outlook}
              </p>

              {/* CTA */}
              <a
                href="/apply"
                className="block w-full text-center px-6 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                Start Your Career Today
              </a>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          *Salary data based on Indiana averages. Actual earnings may vary based on employer, location, and individual performance.
        </p>
      </div>
    </section>
  );
}

export default SalaryCalculator;
