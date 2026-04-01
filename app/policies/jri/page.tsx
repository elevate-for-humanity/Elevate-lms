
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Ready Indy Policy | Elevate for Humanity',
  description: 'Job Ready Indy funding policy for workforce training for justice-involved individuals. Eligibility, covered services, and application process.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies/jri' },
};

export default function JRIPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Job Ready Indy' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/hero-images/jri-hero.jpg" alt="Job Ready Indy" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Job Ready Indy</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Workforce training and career support for justice-involved individuals</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2024</p>

          <div className="prose prose-lg max-w-none">
            <h2>Overview</h2>
            <p>
              The Job Ready Indy provides funding for workforce training programs
              designed to reduce recidivism and support successful reentry into the community. Through Job Ready Indy,
              eligible individuals can access career training, job placement assistance, and supportive
              services at no cost.
            </p>

            <h2>Eligibility Requirements</h2>
          </div>

          <div className="my-8 grid md:grid-cols-2 gap-6">
            <div className="bg-brand-green-50 rounded-xl p-6 border border-brand-green-200">
              <h3 className="font-bold text-brand-green-800 mb-4">Who Qualifies</h3>
              <ul className="space-y-3">
                {[
                  'Currently or formerly incarcerated individuals',
                  'Individuals on probation or parole',
                  'Referred by a probation/parole officer or case manager',
                  'Indiana residents (or residing in a participating state)',
                  'Committed to completing the training program',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-200">
              <h3 className="font-bold text-brand-blue-800 mb-4">Covered Services</h3>
              <ul className="space-y-3">
                {[
                  'Tuition and training fees',
                  'Certification exam costs',
                  'Required tools and supplies',
                  'Transportation assistance',
                  'Job placement support',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Available Programs</h2>
            <p>Job Ready Indy-funded participants may enroll in any of our approved training programs, including:</p>
            <ul>
              <li>Barber Apprenticeship (2,000 hours)</li>
              <li>HVAC Technician Training (12 weeks)</li>
              <li>CDL Commercial Driving (4-8 weeks)</li>
              <li>IT Help Desk / Certiport IT Specialist (8 weeks)</li>
              <li>Healthcare certifications (CNA, Medical Assistant)</li>
              <li>Skilled trades (Welding, Electrical, Plumbing)</li>
            </ul>

            <h2>Application Process</h2>
            <ol>
              <li>Obtain a referral from your probation/parole officer or case manager</li>
              <li>Complete the online application at <Link href="/start" className="text-brand-blue-600">elevateforhumanity.org/apply</Link></li>
              <li>Attend an orientation session (virtual or in-person)</li>
              <li>Meet with an enrollment counselor to select your program</li>
              <li>Begin training upon enrollment approval</li>
            </ol>

            <h2>Participant Responsibilities</h2>
            <ul>
              <li>Maintain regular attendance (minimum 80%)</li>
              <li>Complete all coursework and assignments on time</li>
              <li>Participate in career readiness activities</li>
              <li>Comply with all program policies and code of conduct</li>
              <li>Cooperate with outcome tracking for 12 months post-completion</li>
            </ul>

            <h2>Supportive Services</h2>
            <p>
              In addition to training, Job Ready Indy participants may access wraparound support services including
              housing referrals, mental health resources, substance abuse counseling, and financial literacy
              workshops. These services are coordinated through our case management team.
            </p>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-white rounded-xl p-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About Job Ready Indy?</h2>
            <p className="text-gray-600 mb-6">Contact our enrollment team for more information about Job Ready Indy eligibility and available programs.</p>
            <div className="flex flex-wrap gap-4">
              <a href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition">
                <Mail className="w-4 h-4" /> Email Us
              </a>
              <a href="/support" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-white transition">
                <Phone className="w-4 h-4" /> (317) 314-3757
              </a>
              <Link href="/start" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700 transition">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
