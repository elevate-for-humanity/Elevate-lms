'use client';
import { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, Clock, DollarSign, Award, Users, CheckCircle2, ArrowRight, MapPin } from 'lucide-react';

interface ProgramTemplateProps {
  title: string;
  category: string;
  tagline: string;
  description: string;
  duration: string;
  format: string;
  price?: string;
  funding?: string[];
  outcomes?: string[];
  careers?: string[];
  heroImage?: string;
  slug: string;
  isApprenticeship?: boolean;
}

export default function ProgramPageTemplate({
  title,
  category,
  tagline,
  description,
  duration,
  format,
  price,
  funding = [],
  outcomes = [],
  careers = [],
  slug,
  isApprenticeship = false,
}: ProgramTemplateProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-blue-200 font-semibold mb-3 uppercase text-sm tracking-wide">{category}</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{title}</h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-6">{tagline}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />{duration}
            </span>
            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4" />{format}
            </span>
            {isApprenticeship && (
              <span className="flex items-center gap-2 bg-brand-orange-600 px-4 py-2 rounded-full">
                <Award className="w-4 h-4" />DOL Registered
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Quick Info */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-brand-blue-700">{duration}</div>
              <div className="text-sm text-slate-600">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-blue-700">{format}</div>
              <div className="text-sm text-slate-600">Format</div>
            </div>
            {price && (
              <div>
                <div className="text-2xl font-bold text-green-600">{price}</div>
                <div className="text-sm text-slate-600">Tuition</div>
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-brand-orange-600">WIOA</div>
              <div className="text-sm text-slate-600">Funding Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">About This Program</h2>
          <p className="text-lg text-slate-700 leading-relaxed mb-8">{description}</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Career Outcomes */}
            {careers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-blue-600" />
                  Career Outcomes
                </h3>
                <ul className="space-y-2">
                  {careers.map((career, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      {career}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Funding Options */}
            {funding.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Funding Options
                </h3>
                <ul className="space-y-2">
                  {funding.map((option, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* What You Learn */}
      {outcomes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">What You&apos;ll Learn</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {outcomes.map((outcome, i) => (
                <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-brand-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your New Career?</h2>
          <p className="text-xl text-blue-100 mb-8">Check your eligibility and apply today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/check-eligibility" className="bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-brand-orange-700">
              Check Eligibility
            </Link>
            <Link href="/contact" className="bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-lg hover:bg-blue-50">
              Contact an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
