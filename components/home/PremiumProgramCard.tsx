'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, GraduationCap, Briefcase, Award, CheckCircle } from 'lucide-react';

interface PremiumProgramCardProps {
  title: string;
  description: string;
  duration: string;
  credential: string;
  salary: string;
  href: string;
  color: string;
  icon: React.ReactNode;
  funding: string;
  relatedCareers?: string[];
  featured?: boolean;
}

export function PremiumProgramCard({
  title,
  description,
  duration,
  credential,
  salary,
  href,
  color,
  icon,
  funding,
  relatedCareers = [],
  featured = false,
}: PremiumProgramCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    amber: { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', gradient: 'from-amber-500 to-orange-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500', gradient: 'from-blue-500 to-cyan-600' },
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', gradient: 'from-emerald-500 to-teal-600' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', gradient: 'from-purple-500 to-indigo-600' },
    red: { bg: 'bg-brand-red-500', text: 'text-brand-red-500', border: 'border-brand-red-500', gradient: 'from-brand-red-500 to-red-600' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group ${
        featured ? 'ring-2 ring-brand-red-500' : ''
      }`}
    >
      {/* Gradient Header */}
      <div className={`relative h-24 bg-gradient-to-br ${colors.gradient} overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '16px 16px',
          }} />
        </div>
        
        {/* Icon */}
        <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center">
          <div className={colors.text}>{icon}</div>
        </div>

        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-white rounded-full text-xs font-bold text-brand-red-600">
            ⭐ Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 pt-8">
        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">{credential}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600 font-medium">{salary}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Annual</span>
          </div>
        </div>

        {/* Funding Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            {funding}
          </span>
        </div>

        {/* Related Careers */}
        {relatedCareers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Related Careers:</p>
            <div className="flex flex-wrap gap-1">
              {relatedCareers.slice(0, 3).map((career) => (
                <span
                  key={career}
                  className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                >
                  {career}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={href}
          className={`block w-full text-center px-4 py-3 bg-gradient-to-r ${colors.gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity`}
        >
          <span className="flex items-center justify-center gap-2">
            Learn More
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-t ${colors.gradient} opacity-5`} />
    </motion.div>
  );
}

export default PremiumProgramCard;
