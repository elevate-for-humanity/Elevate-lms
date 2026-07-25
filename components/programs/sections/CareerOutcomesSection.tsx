'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Calculator, TrendingUp, Sparkles } from 'lucide-react';

interface SalaryTier {
  title: string;
  range: string;
  description?: string;
  popular?: boolean;
}

interface CareerPath {
  title: string;
  icon?: string;
  image?: string; // Optional real image path
}

interface CareerOutcomesSectionProps {
  title?: string;
  subtitle?: string;
  salaries: SalaryTier[];
  careers: CareerPath[];
  calculatorEnabled?: boolean;
  tuition?: number;
}

export function CareerOutcomesSection({
  title = "Career Outcomes",
  subtitle = "Build your income over time",
  salaries,
  careers,
  calculatorEnabled = true,
  tuition = 4980,
}: CareerOutcomesSectionProps) {
  const [services, setServices] = useState(15);
  const [price, setPrice] = useState(35);
  const [days, setDays] = useState(5);
  const [tips, setTips] = useState(15);

  const weeklyRevenue = services * price * days;
  const annualRevenue = weeklyRevenue * 52;
  const annualTips = weeklyRevenue * (tips / 100) * 52;
  const grossAnnual = annualRevenue + annualTips;

  return (
    <section className="py-12 lg:py-16 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-500/20 rounded-full text-brand-red-400 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Earning potential
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-slate-400">{subtitle}</p>
        </motion.div>

        {/* Salary Tiers - Staggered cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {salaries.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
              className={`relative rounded-2xl p-8 ${
                tier.popular
                  ? 'bg-gradient-to-br from-brand-red-500 to-brand-red-600 shadow-xl shadow-brand-red-500/30'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-brand-red-600 text-xs font-bold rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center pt-4">
                <h3 className={`text-lg font-semibold mb-3 ${tier.popular ? 'text-white/80' : 'text-slate-400'}`}>
                  {tier.title}
                </h3>
                <p className={`text-4xl font-black mb-2 ${tier.popular ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400'}`}>
                  {tier.range}
                </p>
                {tier.description && (
                  <p className={`text-sm ${tier.popular ? 'text-red-100' : 'text-slate-500'}`}>
                    {tier.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Calculator + Careers Row */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Income Calculator */}
          {calculatorEnabled && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Income Calculator</h3>
                  <p className="text-sm text-slate-500">Estimate your potential earnings</p>
                </div>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Services per day</label>
                    <span className="text-sm font-bold text-brand-red-600">{services}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={services}
                    onChange={(e) => setServices(Number(e.target.value))}
                    className="w-full accent-brand-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Avg price per service</label>
                    <span className="text-sm font-bold text-brand-red-600">${price}</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-brand-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Days worked per week</label>
                    <span className="text-sm font-bold text-brand-red-600">{days}</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={7}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full accent-brand-red-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Average tip %</label>
                    <span className="text-sm font-bold text-brand-red-600">{tips}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={tips}
                    onChange={(e) => setTips(Number(e.target.value))}
                    className="w-full accent-brand-red-500"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-400 mb-1">Projected Annual Income</p>
                  <p className="text-5xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    ${grossAnnual.toLocaleString()}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Weekly</p>
                    <p className="font-bold text-lg">${weeklyRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">Monthly</p>
                    <p className="font-bold text-lg">${(weeklyRevenue * 4).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-slate-400 text-xs mb-1">With Tips</p>
                    <p className="font-bold text-lg text-amber-400">+${annualTips.toLocaleString()}</p>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-4 text-center">
                  *Before expenses. Actual income varies by location and clientele.
                </p>
              </div>
            </motion.div>
          )}

          {/* Career Paths */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-red-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-brand-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Career Opportunities</h3>
                <p className="text-sm text-slate-400">Where your skills can take you</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {careers.map((career, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-all cursor-default overflow-hidden"
                >
                  {career.image ? (
                    <>
                      <img 
                        src={career.image} 
                        alt={career.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <span className="text-white text-sm font-medium group-hover:text-brand-red-300 transition-colors">
                        {career.title}
                      </span>
                    </>
                  ) : career.icon ? (
                    <>
                      <span className="text-xl group-hover:scale-110 transition-transform">{career.icon}</span>
                      <span className="text-white text-sm font-medium group-hover:text-brand-red-300 transition-colors">
                        {career.title}
                      </span>
                    </>
                  ) : (
                    <span className="text-white text-sm font-medium group-hover:text-brand-red-300 transition-colors">
                      {career.title}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Tuition Info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">Program Tuition</span>
                <span className="text-white font-bold text-2xl">${tuition.toLocaleString()}</span>
              </div>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Funding available for eligible participants
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CareerOutcomesSection;
