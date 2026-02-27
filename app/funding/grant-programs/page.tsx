"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { programs } from '@/app/data/programs';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createBrowserClient } from '@supabase/ssr';
const grantFundedPrograms = programs.filter((p) =>
  p.fundingOptions.some(
    (f) =>
      f.toLowerCase().includes('wioa') ||
      f.toLowerCase().includes('wrg') ||
      f.toLowerCase().includes('jri') ||
      f.toLowerCase().includes('workforce') ||
      f.toLowerCase().includes('grant')
  )
);

export default function GrantProgramsPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('funding_sources').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Grant Programs' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/heroes/lms-analytics.jpg"
          alt="Funded Training Programs"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      {/* What is ETPL/WRG */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            What Does ETPL Approved Mean?
          </h2>

          <p className="text-lg text-black mb-6">
            ETPL stands for <strong>Eligible Training Provider List</strong>. It
            means our programs are approved by the state for Funded training
            through government funding programs like WIOA, WRG, and JRI.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-3 text-brand-blue-900">WIOA</h3>
              <p className="text-sm text-black mb-2">
                Workforce Innovation and Opportunity Act
              </p>
              <p className="text-black">
                Federal program providing free training for eligible adults and
                dislocated workers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-3 text-brand-blue-900">WRG</h3>
              <p className="text-sm text-black mb-2">
                Workforce Ready Grant (Indiana)
              </p>
              <p className="text-black">
                State program covering short-term training (4-12 weeks) for
                Indiana residents.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-3 text-brand-blue-900">JRI</h3>
              <p className="text-sm text-black mb-2">
                Justice Reinvestment Initiative
              </p>
              <p className="text-black">
                Programs for individuals with criminal justice involvement
                seeking employment.
              </p>
            </div>
          </div>

          <div className="bg-brand-green-50 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-3 text-brand-green-900">
              What's Covered?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>100% Tuition</strong> - No cost to you
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>Books & Materials</strong> - All included
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>Certification Exams</strong> - Fees covered
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green-600 font-bold text-base">
                  •
                </span>
                <span className="text-black">
                  <strong>No Payback Required</strong> - It's a grant, not a
                  loan
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Available Programs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            ETPL Approved Programs
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grantFundedPrograms.map((program: any) => (
              <div
                key={program.slug}
                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={program.heroImage}
                    alt={program.heroImageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{program.name}</h3>
                  <p className="text-black mb-4 line-clamp-2">
                    {program.shortDescription}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-black">
                      <strong>Duration:</strong> {program.duration}
                    </p>
                    <p className="text-sm text-black">
                      <strong>Delivery:</strong> {program.delivery}
                    </p>
                    {program.price && (
                      <div className="bg-slate-50 rounded p-3 mt-3">
                        <p className="text-sm font-semibold text-black mb-1">
                          Self-Pay Option (if funding not available):
                        </p>
                        <p className="text-lg font-bold text-black">
                          ${program.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-black mt-1">
                          Or split over 6 months: $
                          {(program.price / 6).toFixed(2)}/month
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-brand-green-50 rounded p-3 mb-4">
                    <p className="text-sm font-semibold text-brand-green-900 mb-1">
                      • Available at no cost with:
                    </p>
                    <ul className="text-xs text-black space-y-1">
                      {program.fundingOptions.slice(0, 3).map((option, idx) => (
                        <li key={idx}>• {option}</li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/programs/${program.slug}`}
                    className="block w-full text-center bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            How to Apply for Free Training
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Apply to Program</h3>
              <p className="text-black">
                Choose your program and submit your application. We'll guide you
                through the process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Check Eligibility</h3>
              <p className="text-black">
                We'll help you determine which funding program you qualify for
                (WIOA, WRG, or JRI).
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-orange-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Start Training</h3>
              <p className="text-black">
                Once approved, start your training immediately. No tuition. No
                debt.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/apply"
              className="inline-block bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Apply Now
            </Link>
            <p className="text-sm text-black mt-4">
              Questions?{' '}
              <Link
                href="/contact"
                className="text-brand-orange-600 hover:underline"
              >
                Contact us
              </Link>{' '}
              or contact us at (317) 314-3757
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Start Your Free Training?
          </h2>
          <p className="text-base md:text-lg text-brand-blue-100 mb-8">
            Explore ETPL-approved programs that may be available at no cost through federal and state funding.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply/student"
              className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
            >
              Check Eligibility
            </Link>
            <Link
              href="/funding/how-it-works"
              className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
            >
              How Funding Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
