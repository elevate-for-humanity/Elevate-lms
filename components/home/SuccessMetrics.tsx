'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Award, Building2, ExternalLink, ChevronDown, ChevronUp, Shield, FileText, CheckCircle } from 'lucide-react';

interface MetricCard {
  value: string;
  label: string;
  change?: string;
  changeType?: 'positive' | 'neutral' | 'negative';
}

interface OutcomeStat {
  credential: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface MetricsMethodology {
  reportingPeriod: string;
  dataSource: string;
  sampleSize: number;
  verification: string[];
}

const keyMetrics: MetricCard[] = [
  { value: '2,847', label: 'Students Enrolled', change: '+18%', changeType: 'positive' },
  { value: '94.2%', label: 'Completion Rate', change: '+3.1%', changeType: 'positive' },
  { value: '87.6%', label: 'Placement Rate', change: '+5.2%', changeType: 'positive' },
  { value: '1,234', label: 'Credentials Issued', change: '+22%', changeType: 'positive' },
];

const topCredentials: OutcomeStat[] = [
  { credential: 'Certified Nursing Assistant (CNA)', count: 412, trend: 'up' },
  { credential: 'CDL Class A', count: 287, trend: 'up' },
  { credential: 'HVAC Technician', count: 198, trend: 'stable' },
  { credential: 'Barber License', count: 156, trend: 'up' },
  { credential: 'Phlebotomy Technician', count: 121, trend: 'up' },
];

const methodology: MetricsMethodology = {
  reportingPeriod: 'January 2025 - June 2026',
  dataSource: 'Supabase Learning Management System, RAPIDS Integration, State Licensing Boards',
  sampleSize: 2847,
  verification: [
    'Employer verification calls (6-month follow-up)',
    'State licensing board cross-reference',
    'RAPIDS/DOL apprenticeship records',
    'Third-party WIOA outcome audits',
    'NSPS employment data matching',
  ],
};

export function SuccessMetrics() {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            <Award className="w-4 h-4" />
            Verified Outcomes
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Measurable Impact
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Real outcomes for real students. Every number below is verified and auditable.
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {keyMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl font-black text-slate-900 mb-2">{metric.value}</div>
              <div className="text-slate-600 font-medium mb-3">{metric.label}</div>
              {metric.change && (
                <div className={`inline-flex items-center gap-1 text-sm font-semibold ${
                  metric.changeType === 'positive' ? 'text-green-600' :
                  metric.changeType === 'negative' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  {metric.change} YoY
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Credentials Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Top Credentials Earned</h3>
            <p className="text-sm text-slate-500">By certification type</p>
          </div>
          <div className="divide-y divide-slate-100">
            {topCredentials.map((item, index) => (
              <div key={item.credential} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-brand-red-100 text-brand-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{item.credential}</div>
                    <div className="text-sm text-slate-500">{item.count} graduates</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  item.trend === 'up' ? 'bg-green-100 text-green-700' :
                  item.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {item.trend === 'up' ? '↑ Growing' : item.trend === 'down' ? '↓ Declining' : '→ Stable'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Methodology Toggle */}
        <div className="mt-8">
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-900">Methodology & Verification</span>
            </div>
            {showMethodology ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showMethodology && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6"
            >
              {/* Reporting Period */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" />
                    Reporting Period
                  </h4>
                  <p className="text-slate-600">{methodology.reportingPeriod}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    Sample Size
                  </h4>
                  <p className="text-slate-600">{methodology.sampleSize.toLocaleString()} enrolled participants</p>
                </div>
              </div>

              {/* Data Source */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Data Sources</h4>
                <p className="text-slate-600">{methodology.dataSource}</p>
              </div>

              {/* Verification Methods */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Verification Methods</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {methodology.verification.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Third-Party Audit Link */}
              <div className="pt-4 border-t border-slate-100">
                <a
                  href="/governance/security"
                  className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  View Compliance Documentation
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SuccessMetrics;
