'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  contactPhone = '(317) 760-7908',
}: ProgramPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: title }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex items-center">
        <div className="absolute inset-0 z-0">
          {heroVideo ? (
            <video
              src={heroVideo}
              poster={heroImage}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <Image
              src={heroImage}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {badges.map((badge, i) => (
              <span 
                key={i}
                className={`px-4 py-2 ${badge.color} text-white text-sm font-bold rounded-full shadow-lg`}
              >
                {badge.text}
              </span>
            ))}
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl text-white drop-shadow-2xl">
            {title}
            {subtitle && (
              <span className="block text-xl md:text-2xl font-bold text-purple-300 mt-2">{subtitle}</span>
            )}
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/90 leading-relaxed">
            {description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {enrollLink && (
              <Link
                href={enrollLink}
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-8 py-4 text-lg font-bold text-white hover:bg-green-700 transition-all shadow-xl"
              >
                Enroll Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            )}
            <Link
              href={applyLink || `/apply?program=${slug}`}
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white hover:bg-purple-700 transition-all shadow-xl"
            >
              Check Eligibility
            </Link>
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="inline-flex items-center justify-center rounded-xl border-2 border-white bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-bold text-white hover:bg-white/20 transition-all"
            >
              <Phone className="mr-2 w-5 h-5" /> Call Us
            </a>
          </div>
        </div>
      </section>

      {/* At a Glance */}
      <section className="bg-white py-12 border-b">
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
              <p className="text-lg font-bold text-gray-900">${price.toLocaleString()}</p>
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
        <section className="bg-green-600 py-6">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white">
                <p className="font-bold text-lg">Funding May Be Available</p>
                <p className="text-green-100">Eligible participants may qualify for {fundingTypes.join(', ')} funding</p>
              </div>
              <Link
                href="/funding"
                className="bg-white text-green-700 px-6 py-3 rounded-lg font-bold hover:bg-green-50 transition"
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
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                Included in Program
              </h3>
              <ul className="space-y-4">
                {included.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-green-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
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
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Requirements</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
              <ul className="space-y-4">
                {requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-800">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
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
      <section className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Career Outcomes</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {outcomes.certifications && outcomes.certifications.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6">
                <Award className="w-10 h-10 text-yellow-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">Certifications</h3>
                <ul className="space-y-2">
                  {outcomes.certifications.map((cert, i) => (
                    <li key={i} className="text-slate-300">• {cert}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {outcomes.careerPaths && outcomes.careerPaths.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-6">
                <Users className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">Career Paths</h3>
                <ul className="space-y-2">
                  {outcomes.careerPaths.map((path, i) => (
                    <li key={i} className="text-slate-300">• {path}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {outcomes.averageSalary && (
              <div className="bg-slate-800 rounded-2xl p-6">
                <DollarSign className="w-10 h-10 text-brand-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-4">Earning Potential</h3>
                <p className="text-3xl font-bold text-green-400">{outcomes.averageSalary}</p>
                <p className="text-slate-400 mt-2">Average annual salary</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Investment</h2>
          <p className="text-gray-600 mb-8">Transparent pricing with flexible options</p>
          
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 text-white shadow-2xl">
            <p className="text-purple-200 text-sm uppercase tracking-wide mb-2">Program Tuition</p>
            <p className="text-5xl font-black mb-4">${price.toLocaleString()}</p>
            {paymentPlan && (
              <p className="text-purple-200 mb-6">{paymentPlan}</p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={enrollLink || `/enroll/${slug}`}
                className="bg-white text-purple-700 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition"
              >
                Enroll & Pay
              </Link>
              <Link
                href="/funding"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition"
              >
                Explore Funding Options
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-100">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">Take the first step toward your new career</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={applyLink || `/apply?program=${slug}`}
              className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition inline-flex items-center justify-center"
            >
              <FileText className="mr-2 w-5 h-5" /> Apply Now
            </Link>
            <a
              href={`tel:${contactPhone.replace(/\D/g, '')}`}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition inline-flex items-center justify-center"
            >
              <Phone className="mr-2 w-5 h-5" /> {contactPhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
