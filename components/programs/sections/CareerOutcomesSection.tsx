'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Briefcase, Calculator } from 'lucide-react';

interface SalaryTier {
  title: string;
  range: string;
  description?: string;
  popular?: boolean;
}

interface CareerPath {
  title: string;
  icon?: string;
}

interface CareerOutcomesSectionProps {
  title?: string;
  salaries: SalaryTier[];
  careers: CareerPath[];
  calculatorEnabled?: boolean;
  tuition?: number;
}

export function CareerOutcomesSection({
  title = "Career Outcomes",
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
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-slate-400">Build your income over time</p>
        </motion.div>

        {/* Salary Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {salaries.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl p-8 ${
                tier.popular
                  ? 'bg-brand-red-600 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              {tier.popular && (
                <span className="inline-block px-3 py-1 bg-white text-brand-red-600 text-xs font-bold rounded-full mb-4">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
              <p className={`text-3xl font-black mb-2 ${tier.popular ? 'text-white' : 'text-amber-400'}`}>
                {tier.range}
              </p>
              {tier.description && (
                <p className={`text-sm ${tier.popular ? 'text-red-100' : 'text-slate-400'}`}>
                  {tier.description}
                </p>
              )}
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
              className="bg-white rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-6 h-6 text-slate-700" />
                <h3 className="text-xl font-bold text-slate-900">Income Calculator</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-slate-700">Services per day</label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={services}
                    onChange={(e) => setServices(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center font-bold text-slate-900">{services} services</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Avg price per service ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Days worked per week</label>
                  <input
                    type="range"
                    min={3}
                    max={7}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center font-bold text-slate-900">{days} days</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Average tip percentage</label>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={tips}
                    onChange={(e) => setTips(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center font-bold text-slate-900">{tips}%</div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 text-white">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-400">Projected Annual Income</p>
                  <p className="text-4xl font-black">${grossAnnual.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-slate-400">Weekly</p>
                    <p className="font-bold">${weeklyRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Monthly</p>
                    <p className="font-bold">${(weeklyRevenue * 4).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">With Tips</p>
                    <p className="font-bold text-amber-400">+${annualTips.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  *Before expenses. Actual income varies.
                </p>
              </div>
            </motion.div>
          )}

          {/* Career Paths */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">Career Opportunities</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {careers.map((career, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3"
                >
                  {career.icon && <span>{career.icon}</span>}
                  <span className="text-white text-sm font-medium">{career.title}</span>
                </div>
              ))}
            </div>

            {/* Tuition Info */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Program Tuition</span>
                <span className="text-white font-bold text-xl">${tuition.toLocaleString()}</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">
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
