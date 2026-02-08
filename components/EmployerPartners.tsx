"use client";

import { motion } from 'framer-motion';
import { Building2, Briefcase, TrendingUp, Users, ArrowRight } from 'lucide-react';

interface Partner {
  name: string;
  industry: string;
  hiringRate: string;
  logo?: string;
}

const partners: Partner[] = [
  // Healthcare
  { name: 'IU Health', industry: 'Healthcare', hiringRate: '95%' },
  { name: 'Community Health Network', industry: 'Healthcare', hiringRate: '92%' },
  { name: 'Eskenazi Health', industry: 'Healthcare', hiringRate: '90%' },
  { name: 'St. Vincent Health', industry: 'Healthcare', hiringRate: '88%' },
  { name: 'Franciscan Health', industry: 'Healthcare', hiringRate: '87%' },

  // HVAC & Trades
  { name: 'Carrier', industry: 'HVAC', hiringRate: '93%' },
  { name: 'Trane Technologies', industry: 'HVAC', hiringRate: '91%' },
  { name: 'Lennox International', industry: 'HVAC', hiringRate: '89%' },
  { name: 'Service Experts', industry: 'HVAC', hiringRate: '86%' },
  { name: 'Comfort Systems USA', industry: 'HVAC', hiringRate: '85%' },

  // Beauty & Cosmetology
  { name: 'Great Clips', industry: 'Beauty', hiringRate: '94%' },
  { name: 'Sport Clips', industry: 'Beauty', hiringRate: '92%' },
  { name: 'Supercuts', industry: 'Beauty', hiringRate: '90%' },
  { name: 'Ulta Beauty', industry: 'Beauty', hiringRate: '88%' },
  { name: 'Regis Corporation', industry: 'Beauty', hiringRate: '87%' },

  // Transportation & Logistics
  { name: 'Schneider', industry: 'Transportation', hiringRate: '96%' },
  { name: 'Swift Transportation', industry: 'Transportation', hiringRate: '94%' },
  { name: 'Werner Enterprises', industry: 'Transportation', hiringRate: '92%' },
  { name: 'J.B. Hunt', industry: 'Transportation', hiringRate: '91%' },
  { name: 'Ryder', industry: 'Transportation', hiringRate: '89%' },

  // Business & Technology
  { name: 'Salesforce', industry: 'Technology', hiringRate: '90%' },
  { name: 'Amazon', industry: 'Technology', hiringRate: '88%' },
  { name: 'Target', industry: 'Retail', hiringRate: '87%' },
  { name: 'Walmart', industry: 'Retail', hiringRate: '86%' },
  { name: 'CVS Health', industry: 'Healthcare', hiringRate: '85%' },

  // Manufacturing
  { name: 'Cummins', industry: 'Manufacturing', hiringRate: '91%' },
  { name: 'Eli Lilly', industry: 'Pharmaceutical', hiringRate: '90%' },
  { name: 'Rolls-Royce', industry: 'Manufacturing', hiringRate: '89%' },
  { name: 'Allison Transmission', industry: 'Manufacturing', hiringRate: '88%' },
  { name: 'Roche Diagnostics', industry: 'Healthcare', hiringRate: '87%' },

  // Hospitality
  { name: 'Marriott', industry: 'Hospitality', hiringRate: '89%' },
  { name: 'Hilton', industry: 'Hospitality', hiringRate: '88%' },
  { name: 'Hyatt', industry: 'Hospitality', hiringRate: '86%' },
  { name: 'IHG Hotels', industry: 'Hospitality', hiringRate: '85%' },
  { name: 'Aramark', industry: 'Food Service', hiringRate: '84%' },

  // Financial Services
  { name: 'JPMorgan Chase', industry: 'Finance', hiringRate: '87%' },
  { name: 'Wells Fargo', industry: 'Finance', hiringRate: '86%' },
  { name: 'PNC Bank', industry: 'Finance', hiringRate: '85%' },
  { name: 'Fifth Third Bank', industry: 'Finance', hiringRate: '84%' },
  { name: 'Old National Bank', industry: 'Finance', hiringRate: '83%' },

  // Additional Partners
  { name: 'FedEx', industry: 'Logistics', hiringRate: '90%' },
  { name: 'UPS', industry: 'Logistics', hiringRate: '89%' },
  { name: 'DHL', industry: 'Logistics', hiringRate: '87%' },
  { name: 'Kroger', industry: 'Retail', hiringRate: '86%' },
  { name: 'Meijer', industry: 'Retail', hiringRate: '85%' },
  { name: 'Anthem', industry: 'Healthcare', hiringRate: '88%' },
  { name: 'WellPoint', industry: 'Healthcare', hiringRate: '87%' },
  { name: 'Zimmer Biomet', industry: 'Medical Devices', hiringRate: '86%' }
];

const industryColors: Record<string, string> = {
  Healthcare: 'bg-blue-100 text-blue-700',
  HVAC: 'bg-orange-100 text-orange-700',
  Beauty: 'bg-pink-100 text-pink-700',
  Transportation: 'bg-green-100 text-green-700',
  Technology: 'bg-brand-red-100 text-brand-red-700',
  Retail: 'bg-yellow-100 text-yellow-700',
  Manufacturing: 'bg-gray-100 text-black',
  Pharmaceutical: 'bg-teal-100 text-teal-700',
  Hospitality: 'bg-indigo-100 text-indigo-700',
  'Food Service': 'bg-red-100 text-red-700',
  Finance: 'bg-emerald-100 text-emerald-700',
  Logistics: 'bg-cyan-100 text-cyan-700',
  'Medical Devices': 'bg-violet-100 text-violet-700'
};

export default function EmployerPartners() {
  // Split partners into two rows for continuous scroll
  const row1 = partners.slice(0, Math.ceil(partners.length / 2));
  const row2 = partners.slice(Math.ceil(partners.length / 2));

  return (
    <section className="py-20     overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            50+ Employer Partners
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Hired by Industry Leaders
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Our graduates work at top companies across healthcare, technology, trades, and more.
            These employers trust Ona to prepare job-ready professionals.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2 text-2xl md:text-3xl lg:text-4xl">50+</div>
            <div className="text-black font-semibold">Employer Partners</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-green-600 mb-2 text-2xl md:text-3xl lg:text-4xl">94%</div>
            <div className="text-black font-semibold">Placement Rate</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-brand-red-600 mb-2 text-2xl md:text-3xl lg:text-4xl">2,500+</div>
            <div className="text-black font-semibold">Graduates Hired</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">$52K</div>
            <div className="text-black font-semibold">Avg. Starting Salary</div>
          </div>
        </motion.div>

        {/* Scrolling Logo Row 1 */}
        <div className="mb-8 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20    z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20    z-10" />

          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -2000],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {[...row1, ...row1].map((partner, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-64 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12    rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-2 rounded-full ${industryColors[partner.industry] || 'bg-gray-100 text-black'}`}>
                    {partner.industry}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2 group-hover:text-blue-600 transition-colors">
                  {partner.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black">Hiring Rate:</span>
                  <span className="font-bold text-green-600">{partner.hiringRate}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scrolling Logo Row 2 (Reverse Direction) */}
        <div className="mb-16 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20    z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20    z-10" />

          <motion.div
            className="flex gap-6"
            animate={{
              x: [-2000, 0],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {[...row2, ...row2].map((partner, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-64 bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12    rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-2 rounded-full ${industryColors[partner.industry] || 'bg-gray-100 text-black'}`}>
                    {partner.industry}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-black mb-2 group-hover:text-green-600 transition-colors">
                  {partner.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black">Hiring Rate:</span>
                  <span className="font-bold text-green-600">{partner.hiringRate}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Industry Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-xl mb-16"
        >
          <h3 className="text-2xl font-bold text-black mb-6 text-center">
            Industries We Serve
          </h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(industryColors).map(([industry, colorClass]) => (
              <div
                key={industry}
                className={`${colorClass} rounded-lg p-4 text-center font-semibold hover:scale-105 transition-transform cursor-pointer`}
              >
                {industry}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Employer Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <div className="   rounded-xl p-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Job-Ready Graduates
            </h3>
            <p className="text-black">
              Our students complete hands-on training and are prepared to contribute from day one.
              No additional training required.
            </p>
          </div>

          <div className="   rounded-xl p-8">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Reduced Turnover
            </h3>
            <p className="text-black">
              Ona graduates have 40% lower turnover rates compared to traditional hires.
              They're committed to their careers.
            </p>
          </div>

          <div className="   rounded-xl p-8">
            <div className="w-12 h-12 bg-brand-red-600 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Diverse Talent Pool
            </h3>
            <p className="text-black">
              Access candidates from diverse backgrounds who bring unique perspectives
              and strong work ethic.
            </p>
          </div>
        </motion.div>

        {/* CTA for Employers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="   rounded-2xl p-12 text-center text-white"
        >
          <Building2 className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h3 className="text-3xl font-bold mb-4">
            Partner With Ona
          </h3>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join 50+ leading employers who hire our graduates. Build your talent pipeline
            with skilled, motivated professionals ready to make an impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/employers"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg text-lg"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/hire-graduates"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-all text-lg"
            >
              Hire Our Graduates
              <Users className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Student CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-xl text-black mb-6">
            Want to work at one of these companies?
          </p>
          <a
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4    text-white rounded-lg font-semibold hover: hover: transition-all shadow-lg hover:shadow-xl text-lg"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
