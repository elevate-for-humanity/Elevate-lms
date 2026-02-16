import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight, Phone, Mail, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Ready Grant Policy | Elevate for Humanity',
  description: 'Indiana Workforce Ready Grant provides up to $7,500/year for tuition in high-demand career training programs. Eligibility, covered programs, and application process.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies/wrg' },
};

export default function WRGPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'WRG' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[350px] flex items-center overflow-hidden">
        <Image src="/hero-images/federal-funded-hero.jpg" alt="Workforce Ready Grant" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-green-900/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 w-full">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Workforce Ready Grant</h1>
          <p className="text-xl text-green-100">Indiana tuition assistance for high-demand career training</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2024</p>

          {/* Award Highlight */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 mb-12 text-center">
            <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-4xl font-bold text-green-700 mb-2">Up to $7,500/year</p>
            <p className="text-gray-600">Tuition and fees covered for qualifying Indiana residents</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Overview</h2>
            <p>
              The Indiana Workforce Ready Grant (WRG) provides tuition assistance for Indiana residents
              pursuing high-value certificates and certifications in high-demand fields. The grant covers
              tuition and mandatory fees at approved training providers, making career training accessible
              to qualifying individuals.
            </p>

            <h2>Eligibility Requirements</h2>
          </div>

          <div className="my-8 grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="font-bold text-green-800 mb-4">Who Qualifies</h3>
              <ul className="space-y-3">
                {[
                  'Indiana resident',
                  'U.S. citizen or eligible non-citizen',
                  'High school diploma or GED equivalent',
                  'Enrolled in an eligible certificate program',
                  'Not currently holding a bachelor\'s degree or higher',
                  'Maintaining satisfactory academic progress',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-200">
              <h3 className="font-bold text-brand-blue-800 mb-4">What Is Covered</h3>
              <ul className="space-y-3">
                {[
                  'Tuition costs up to $7,500 per academic year',
                  'Mandatory program fees',
                  'Certification exam fees (select programs)',
                  'Required textbooks and materials (select programs)',
                  'Stackable credentials toward further education',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Eligible Programs</h2>
            <p>WRG covers certificates in high-demand fields including:</p>
            <ul>
              <li>Healthcare (CNA, Medical Assistant, Phlebotomy)</li>
              <li>Information Technology (CompTIA A+, Network+, Security+)</li>
              <li>Skilled Trades (HVAC, Welding, Electrical, Plumbing)</li>
              <li>Transportation (CDL Commercial Driving)</li>
              <li>Business (Accounting, Office Administration)</li>
              <li>Advanced Manufacturing</li>
            </ul>

            <h2>Application Process</h2>
            <ol>
              <li>Complete the FAFSA (Free Application for Federal Student Aid)</li>
              <li>Apply to Elevate for Humanity at <Link href="/apply" className="text-brand-blue-600">elevateforhumanity.org/apply</Link></li>
              <li>Select an eligible certificate program</li>
              <li>Meet with a financial aid counselor to confirm WRG eligibility</li>
              <li>Enroll and begin training</li>
            </ol>

            <h2>Maintaining Eligibility</h2>
            <ul>
              <li>Maintain satisfactory academic progress (minimum 2.0 GPA equivalent)</li>
              <li>Attend classes regularly (minimum 80% attendance)</li>
              <li>Complete the program within the expected timeframe</li>
              <li>Remain enrolled in an eligible certificate program</li>
            </ul>

            <h2>Renewal</h2>
            <p>
              The WRG may be renewed for up to two academic years, provided the student continues to meet
              eligibility requirements and maintains satisfactory academic progress. Students must reapply
              each academic year.
            </p>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-slate-50 rounded-xl p-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About WRG?</h2>
            <p className="text-gray-600 mb-6">Our financial aid team can help determine your eligibility and guide you through the application process.</p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:elevate4humanityedu@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition">
                <Mail className="w-4 h-4" /> Email Us
              </a>
              <a href="/support" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
                <Phone className="w-4 h-4" /> Get Help Online
              </a>
              <Link href="/apply" className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
