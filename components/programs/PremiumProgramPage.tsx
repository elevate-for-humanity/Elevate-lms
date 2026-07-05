'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  DollarSign, 
  Award, 
  CheckCircle, 
  Users, 
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Wrench,
  Building2,
  GraduationCap,
  Briefcase,
  Star,
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';
import { ROICalculator } from '../home/ROICalculator';
import { SalaryCalculator } from '../home/SalaryCalculator';

interface PremiumProgramPageProps {
  program: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    duration: string;
    credential: string;
    salary: { low: number; high: number };
    href: string;
    color: string;
    icon: React.ReactNode;
    industry: string;
    outcomes: string[];
    curriculum: { module: string; topics: string[] }[];
    certifications: { name: string; description: string }[];
    careers: { title: string; salary: string }[];
    employers: { name: string; type: string }[];
    funding: { name: string; coverage: string }[];
    requirements: string[];
    testimonials?: { name: string; quote: string; outcome: string }[];
  };
}

export function PremiumProgramPage({ program }: PremiumProgramPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'careers' | 'funding'>('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const colorMap: Record<string, string> = {
    amber: 'from-amber-500 to-orange-600',
    blue: 'from-blue-500 to-cyan-600',
    emerald: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-indigo-600',
    red: 'from-brand-red-500 to-red-600',
  };

  const color = colorMap[program.color] || colorMap.blue;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className={`relative bg-gradient-to-br ${color} py-20 overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Breadcrumb */}
            <div className="flex items-center justify-center gap-2 text-white/80 text-sm mb-6">
              <Link href="/programs" className="hover:text-white">Programs</Link>
              <span>/</span>
              <span className="text-white">{program.name}</span>
            </div>

            {/* Icon */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <div className="text-slate-900">{program.icon}</div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
              {program.name}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {program.tagline}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl font-bold text-white">{program.duration}</p>
                <p className="text-sm text-white/70">Duration</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-lg font-bold text-white">{program.credential}</p>
                <p className="text-sm text-white/70">Credential</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl font-bold text-white">${(program.salary.low/1000).toFixed(0)}K-${(program.salary.high/1000).toFixed(0)}K</p>
                <p className="text-sm text-white/70">Annual Salary</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl font-bold text-white">{program.certifications.length}</p>
                <p className="text-sm text-white/70">Certifications</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
              >
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/schedule-consultation"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-colors"
              >
                Schedule Free Consultation
              </Link>
              <Link
                href="/eligibility"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-colors"
              >
                Check Funding Eligibility
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: <CheckCircle className="w-5 h-5" />, text: 'DOL Registered' },
              { icon: <Award className="w-5 h-5" />, text: 'WIOA Approved' },
              { icon: <Building2 className="w-5 h-5" />, text: '40+ Employers' },
              { icon: <Users className="w-5 h-5" />, text: '2,000+ Graduates' },
              { icon: <Star className="w-5 h-5" />, text: '98% Pass Rate' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-600">
                <span className="text-brand-red-600">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-0 bg-white border-b border-slate-200 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {(['overview', 'curriculum', 'careers', 'funding'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-brand-red-600 text-brand-red-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* About */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">About This Program</h2>
                  <p className="text-slate-600 leading-relaxed">{program.description}</p>
                </motion.div>

                {/* What You'll Learn */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">What You'll Learn</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {program.outcomes.map((outcome, i) => (
                      <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Certifications */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Certifications You'll Earn</h2>
                  <div className="space-y-3">
                    {program.certifications.map((cert, i) => (
                      <div key={i} className="bg-gradient-to-r from-brand-red-50 to-transparent rounded-xl p-4 border-l-4 border-brand-red-600">
                        <h3 className="font-bold text-slate-900">{cert.name}</h3>
                        <p className="text-sm text-slate-600">{cert.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Employer Partners */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Hiring Partners</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {program.employers.map((emp, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-sm text-slate-500">{emp.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Have Questions?</h3>
                  <div className="space-y-3">
                    <a href="tel:1-800-555-0123" className="flex items-center gap-3 text-slate-600 hover:text-brand-red-600">
                      <Phone className="w-5 h-5" />
                      1-800-555-0123
                    </a>
                    <a href="mailto:admissions@elevateforhumanity.org" className="flex items-center gap-3 text-slate-600 hover:text-brand-red-600">
                      <Mail className="w-5 h-5" />
                      admissions@elevateforhumanity.org
                    </a>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Admission Requirements</h3>
                  <ul className="space-y-2">
                    {program.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Program Curriculum</h2>
              <div className="space-y-4">
                {program.curriculum.map((module, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                      className="w-full p-6 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold`}>
                          {i + 1}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{module.module}</h3>
                      </div>
                      {expandedModule === i ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    {expandedModule === i && (
                      <div className="px-6 pb-6 pt-0">
                        <ul className="space-y-2 ml-16">
                          {module.topics.map((topic, j) => (
                            <li key={j} className="flex items-start gap-2 text-slate-600">
                              <BookOpen className="w-4 h-4 text-brand-red-500 mt-1 flex-shrink-0" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'careers' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Career Opportunities</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {program.careers.map((career, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{career.title}</h3>
                        <p className="text-emerald-600 font-semibold">{career.salary}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'funding' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Funding Options</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {program.funding.map((fund, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-emerald-50 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900">{fund.name}</h3>
                        <p className="text-emerald-600 font-semibold">{fund.coverage}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/eligibility"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
                >
                  Check Your Eligibility
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROI Calculator Section */}
      <ROICalculator />

      {/* Final CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
            Ready to Start Your {program.name} Career?
          </h2>
          <p className="text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of graduates who have transformed their careers through Elevate programs.
            Most students pay $0 to $500 out of pocket through workforce funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors shadow-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/schedule-consultation"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Schedule Free Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PremiumProgramPage;
