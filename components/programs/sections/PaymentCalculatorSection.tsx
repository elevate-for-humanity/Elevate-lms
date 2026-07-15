'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Calendar, TrendingDown, CheckCircle } from 'lucide-react';

interface PaymentCalculatorSectionProps {
  tuition: number;
  title?: string;
  subtitle?: string;
}

const DEPOSIT_OPTIONS = [0, 250, 500, 1000];
const PAYMENT_TERMS = [12, 24, 36, 52]; // weeks

export function PaymentCalculatorSection({
  tuition = 4980,
  title = "Payment Calculator",
  subtitle = "See your options. Most students pay $0 with funding."
}: PaymentCalculatorSectionProps) {
  const [deposit, setDeposit] = useState(250);
  const [weeks, setWeeks] = useState(24);

  const remainingBalance = Math.max(0, tuition - deposit);
  const weeklyPayment = remainingBalance / weeks;
  const totalPaid = deposit + (weeklyPayment * weeks);

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
            <DollarSign className="w-4 h-4" />
            Payment Options
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">{title}</h2>
          <p className="text-lg text-white/80">{subtitle}</p>
        </motion.div>

        {/* Funding Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-bold">Most Students Pay $0 with Funding</span>
          </div>
          <p className="text-white/70 text-sm">
            WIOA, Workforce Ready Grant, FSSA IMPACT may cover full tuition
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calculator Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-red-500/20 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-brand-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Calculate Your Payment</h3>
                <p className="text-sm text-white/60">Program Tuition: ${tuition.toLocaleString()}</p>
              </div>
            </div>

            {/* Deposit Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3 text-white/80">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Initial Deposit
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DEPOSIT_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDeposit(amount)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      deposit === amount
                        ? 'bg-brand-red-500 text-white shadow-lg shadow-brand-red-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    {amount === 0 ? '$0 (Deferred)' : `$${amount}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Term Selection */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-white/80">
                <Calendar className="w-4 h-4 inline mr-1" />
                Payment Term
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_TERMS.map((term) => (
                  <button
                    key={term}
                    onClick={() => setWeeks(term)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      weeks === term
                        ? 'bg-brand-red-500 text-white shadow-lg shadow-brand-red-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                  >
                    {term} weeks
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 text-slate-900"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-green-600" />
              Your Payment Plan
            </h3>

            {/* Payment Breakdown */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Program Tuition</span>
                <span className="font-bold text-slate-900">${tuition.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Initial Deposit</span>
                <span className="font-bold text-slate-900">${deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Remaining Balance</span>
                <span className="font-bold text-slate-900">${remainingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-600">Payment Term</span>
                <span className="font-bold text-slate-900">{weeks} weeks</span>
              </div>
            </div>

            {/* Weekly Payment Highlight */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white text-center mb-6">
              <p className="text-sm text-white/60 mb-2">Your Weekly Payment</p>
              <p className="text-4xl font-black text-amber-400">
                ${weeklyPayment.toFixed(2)}
              </p>
              <p className="text-sm text-white/60 mt-1">
                Total: ${totalPaid.toLocaleString()}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <a
                href="/check-eligibility"
                className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-center transition-colors"
              >
                Check Funding Eligibility → $0可能
              </a>
              <a
                href="/programs/barber-apprenticeship/payment/bnpl"
                className="block w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl text-center transition-colors"
              >
                View BNPL Providers
              </a>
            </div>

            <p className="text-xs text-slate-500 mt-4 text-center">
              *Payment plans subject to approval. Funding may reduce or eliminate costs.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default PaymentCalculatorSection;
