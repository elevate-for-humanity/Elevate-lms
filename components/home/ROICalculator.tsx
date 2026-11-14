'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Clock, Award, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface ROICalculatorProps {
  className?: string;
}

interface CalculationResult {
  programCost: number;
  fundingAmount: number;
  yourInvestment: number;
  averageSalary: number;
  yearsToBreakEven: number;
  lifetimeEarnings: number;
  roi: number;
}

const PROGRAM_DATA = [
  { name: 'Barbering', cost: 9500, salary: 45000, duration: 52 },
  { name: 'HVAC', cost: 12000, salary: 55000, duration: 48 },
  { name: 'CNA/Med Aide', cost: 6500, salary: 38000, duration: 16 },
  { name: 'CDL', cost: 8500, salary: 62000, duration: 8 },
  { name: 'Medical Billing', cost: 7500, salary: 42000, duration: 24 },
];

export function ROICalculator({ className = '' }: ROICalculatorProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [selectedProgram, setSelectedProgram] = useState(PROGRAM_DATA[0]);
  const [fundingPercentage, setFundingPercentage] = useState(75);
  const [yearsWorked, setYearsWorked] = useState(10);
  const [showResults, setShowResults] = useState(false);

  const calculation: CalculationResult = {
    programCost: selectedProgram.cost,
    fundingAmount: Math.round(selectedProgram.cost * (fundingPercentage / 100)),
    yourInvestment: selectedProgram.cost - Math.round(selectedProgram.cost * (fundingPercentage / 100)),
    averageSalary: selectedProgram.salary,
    yearsToBreakEven: 0, // calculated below
    lifetimeEarnings: 0, // calculated below
    roi: 0, // calculated below
  };

  calculation.yearsToBreakEven = Math.round((calculation.yourInvestment / (selectedProgram.salary - 35000)) * 10) / 10 || 0.5;
  calculation.lifetimeEarnings = selectedProgram.salary * yearsWorked;
  calculation.roi = Math.round(((calculation.lifetimeEarnings - calculation.yourInvestment) / calculation.yourInvestment) * 100);

  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 500);
    return () => clearTimeout(timer);
  }, [selectedProgram, fundingPercentage, yearsWorked]);

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600/20 border border-brand-red-600/40 rounded-full text-brand-red-400 text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            Interactive Tool
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Calculate Your Return on Investment
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">
            See how quickly your career investment pays off. Most students break even within their first year.
          </p>
        </motion.div>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-red-600" />
                Your Investment Details
              </h3>

              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Your Program
                </label>
                <select
                  value={selectedProgram.name}
                  onChange={(e) => {
                    const program = PROGRAM_DATA.find(p => p.name === e.target.value);
                    if (program) setSelectedProgram(program);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-red-600 focus:border-brand-red-600 text-slate-900"
                >
                  {PROGRAM_DATA.map((program) => (
                    <option key={program.name} value={program.name}>
                      {program.name} - ${program.cost.toLocaleString()} ({program.duration} weeks)
                    </option>
                  ))}
                </select>
              </div>

              {/* Funding Slider */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estimated Funding Coverage: {fundingPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={fundingPercentage}
                  onChange={(e) => setFundingPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  WIOA funding may cover up to 100% of your program cost based on eligibility.
                </p>
              </div>

              {/* Years to Calculate */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Career Duration: {yearsWorked} years
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={yearsWorked}
                  onChange={(e) => setYearsWorked(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-red-600"
                />
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-red-600" />
                Your Results
              </h3>

              {showResults && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {/* Main ROI */}
                  <div className="text-center p-6 bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-xl text-white">
                    <p className="text-sm opacity-80 mb-1">Return on Investment</p>
                    <p className="text-5xl font-extrabold">{calculation.roi}%</p>
                    <p className="text-sm opacity-80 mt-1">Over {yearsWorked} years</p>
                  </div>

                  {/* Break Even */}
                  <div className="bg-white rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Break Even Point</p>
                      <p className="text-xl font-bold text-slate-900">
                        {calculation.yearsToBreakEven} years
                      </p>
                    </div>
                  </div>

                  {/* Investment Breakdown */}
                  <div className="bg-white rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Program Cost</span>
                      <span className="font-semibold text-slate-900">${calculation.programCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Your Funding</span>
                      <span className="font-semibold text-emerald-600">-${calculation.fundingAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-semibold text-slate-900">Your Investment</span>
                      <span className="font-bold text-brand-red-600">${calculation.yourInvestment.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Lifetime Earnings */}
                  <div className="bg-white rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Lifetime Earnings ({yearsWorked} years)</p>
                      <p className="text-xl font-bold text-slate-900">
                        ${calculation.lifetimeEarnings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">
              <CheckCircle className="w-4 h-4 inline mr-1 text-emerald-500" />
              Free eligibility check available
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/eligibility"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                Check Your Eligibility
                <TrendingUp className="w-4 h-4" />
              </a>
              <a
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Apply Now
              </a>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center text-slate-400 text-sm mt-6"
        >
          *Estimates based on average graduate data. Actual results may vary. Funding eligibility determined individually.
        </motion.p>
      </div>
    </section>
  );
}

export default ROICalculator;
