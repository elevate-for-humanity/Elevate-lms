'use client';

import Link from 'next/link';
import Image from 'next/image';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { 
  
  XCircle, 
  Clock, 
  DollarSign, 
  Award, 
  Users, 
  MapPin,
  Calendar,
  ArrowRight,
  Phone,
  FileText
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export interface ProgramPageProps {
  // Basic Info
  title: string;
  subtitle?: string;
  description: string;
  slug: string;
  
  // Hero
  heroImage: string;
  heroVideo?: string;
  badges: { text: string; color: string }[];
  
  // At a Glance
  duration: string;
  format: string; // "In-Person", "Hybrid", "Online"
  location?: string;
  schedule?: string;
  
  // Pricing
  price: number;
  paymentPlan?: string;
  fundingAvailable?: boolean;
  fundingTypes?: string[];
  
  // What's Included / Not Included
  included: string[];
  notIncluded?: string[];
  
  // Requirements
  requirements: string[];
  
  // Outcomes
  outcomes: {
    credential?: string;
    certifications?: string[];
    careerPaths?: string[];
    averageSalary?: string;
  };
  
  // CTAs
  enrollLink?: string;
  applyLink?: string;
  contactPhone?: string;
}

export function ProgramPageTemplate({
  title,
  subtitle,
  description,
  slug,
  heroImage,
  heroVideo,
  badges,
  duration,
  format,
  location,
  schedule,
  price,
  paymentPlan,
  fundingAvailable = true,
  fundingTypes = ['WIOA', 'WRG', 'JRI'],
  included,
  notIncluded,
  requirements,
  outcomes,
  enrollLink,
  applyLink,
  contactPhone = '(317) 314-3757',
}: ProgramPageProps) {


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: title }]} />
        </div>
      </div>

      {/* Hero Image — clean, no overlays */}
      <section className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        {heroVideo ? (
          <CanonicalVideo
            src={heroVideo}
            poster={heroImage || '/images/og-default.jpg'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={heroImage}
            alt={title}
            fill
            className="object-cover"
            priority
           sizes="100vw" />
        )}
      </section>

      {/* Title + CTAs below hero in white */}
      <section className="py-10 border-b">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {badges.map((badge, i) => (
              <span
                key={i}
                className={`px-3 py-1 ${badge.color} text-white text-sm font-semibold rounded-full`}
              >
                {badge.text}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            {title}
            {subtitle && (
              <span className="block text-xl font-semibold text-slate-600 mt-1">{subtitle}</span>
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 leading-relaxed">{description}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {enrollLink && (
              <Link
                href={enrollLink}
                className="inline-flex items-center justify-center rounded-lg bg-brand-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-brand-blue-700 transition-all"
              >
                Enroll Now <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            )}
            <Link
              href={applyLink || `/apply?program=${slug}`}
              className="inline-flex items-center justify-center rounded-lg border border-brand-blue-600 px-6 py-3 text-base font-bold text-brand-blue-600 hover:bg-brand-blue-50 transition-all"
            >
              Check Eligibility
            </Link>
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <Phone className="mr-2 w-4 h-4" /> Call Us
            </a>
          </div>
        </div>
      </section>

      {/* At a Glance */}
      <section className="py-12 border-b">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-bold text-gray-900">{duration}</p>
            </div>
            <div className="text-center p-4">
              <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Format</p>
              <p className="text-lg font-bold text-gray-900">{format}</p>
            </div>
            <div className="text-center p-4">
              <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Tuition</p>
              <p className="text-lg font-bold text-gray-900">${price.toLocaleString('en-US')}</p>
            </div>
            <div className="text-center p-4">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Credential</p>
              <p className="text-lg font-bold text-gray-900">{outcomes.credential || 'Certificate'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Banner */}
      {fundingAvailable && (
        <section className="py-6">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white">
                <p className="font-bold text-lg">Funding May Be Available</p>
                <p className="text-white">Eligible participants may qualify for {fundingTypes.join(', ')} funding</p>
              </div>
              <Link
                href="/funding"
                className="bg-white text-brand-green-700 px-6 py-3 rounded-lg font-bold hover:bg-brand-green-50 transition"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* What's Included / Not Included */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What's Included</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Included */}
            <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-brand-green-900 mb-6 flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Included in Program
              </h3>
              <ul className="space-y-4">
                {included.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-brand-green-900">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Not Included */}
            {notIncluded && notIncluded.length > 0 && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <XCircle className="w-6 h-6" />
                  Not Included
                </h3>
                <ul className="space-y-4">
                  {notIncluded.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Requirements</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
              <ul className="space-y-4">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-800">
                    <div className="w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {i + 1}
                    </div>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="py-16 border-b">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-900">Career Outcomes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {outcomes.certifications && outcomes.certifications.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-6">
                <Award className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-4 text-slate-900">Certifications</h3>
                <ul className="space-y-2">
                  {outcomes.certifications.map((cert, i) => (
                    <li key={i} className="text-slate-600">• {cert}</li>
                  ))}
                </ul>
              </div>
            )}
            {outcomes.careerPaths && outcomes.careerPaths.length > 0 && (
              <div className="border border-slate-200 rounded-2xl p-6">
                <Users className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-4 text-slate-900">Career Paths</h3>
                <ul className="space-y-2">
                  {outcomes.careerPaths.map((path, i) => (
                    <li key={i} className="text-slate-600">• {path}</li>
                  ))}
                </ul>
              </div>
            )}
            {outcomes.averageSalary && (
              <div className="border border-slate-200 rounded-2xl p-6">
                <DollarSign className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-4 text-slate-900">Earning Potential</h3>
                <p className="text-3xl font-bold text-slate-900">{outcomes.averageSalary}</p>
                <p className="text-slate-500 mt-2">Average annual salary</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment</h2>
          <p className="text-gray-600 mb-8">Transparent pricing with flexible options</p>
          
          <div className="border border-slate-200 rounded-2xl p-8">
            <p className="text-slate-500 text-sm uppercase tracking-wide mb-2">Program Tuition</p>
            <p className="text-5xl font-black mb-4 text-slate-900">${price.toLocaleString('en-US')}</p>
            {paymentPlan && (
              <p className="text-slate-600 mb-6">{paymentPlan}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={enrollLink || `/enroll/${slug}`}
                className="bg-brand-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-700 transition"
              >
                Enroll & Pay
              </Link>
              <Link
                href="/funding"
                className="border border-brand-blue-600 text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-50 transition"
              >
                Explore Funding Options
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-600 mb-8">Take the first step toward your new career</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={applyLink || `/apply?program=${slug}`}
              className="bg-brand-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-blue-700 transition inline-flex items-center justify-center"
            >
              <FileText className="mr-2 w-5 h-5" /> Apply Now
            </Link>
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="border border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition inline-flex items-center justify-center"
            >
              <Phone className="mr-2 w-5 h-5" /> {contactPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
