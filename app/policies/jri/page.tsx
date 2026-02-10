import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Justice Reinvestment Initiative Policy | Elevate for Humanity',
  description: 'JRI funding policy for workforce training for justice-involved individuals. Eligibility, covered services, and application process.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/policies/jri' },
};

export default function JRIPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'JRI' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[350px] flex items-center overflow-hidden">
        <Image src="/hero-images/jri-hero.jpg" alt="Justice Reinvestment Initiative" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-16 w-full">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Justice Reinvestment Initiative</h1>
          <p className="text-xl text-slate-200">Workforce training and career support for justice-involved individuals</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 22, 2024</p>

          <div className="prose prose-lg max-w-none">
            <h2>Overview</h2>
            <p>
              The Justice Reinvestment Initiative (JRI) provides funding for workforce training programs
              designed to reduce recidivism and support successful reentry into the community. Through JRI,
              eligible individuals can access career training, job placement assistance, and supportive
              services at no cost.
            </p>

            <h2>Eligibility Requirements</h2>
          </div>

          <div className="my-8 grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="font-bold text-green-800 mb-4">Who Qualifies</h3>
              <ul className="space-y-3">
                {[
                  'Currently or formerly incarcerated individuals',
                  'Individuals on probation or parole',
                  'Referred by a probation/parole officer or case manager',
                  'Indiana residents (or residing in a participating state)',
                  'Committed to completing the training program',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-4">Covered Services</h3>
              <ul className="space-y-3">
                {[
                  'Tuition and training fees',
                  'Certification exam costs',
                  'Required tools and supplies',
                  'Transportation assistance',
                  'Job placement support',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Available Programs</h2>
            <p>JRI-funded participants may enroll in any of our approved training programs, including:</p>
            <ul>
              <li>Barber Apprenticeship (2,000 hours)</li>
              <li>HVAC Technician Training (12-16 weeks)</li>
              <li>CDL Commercial Driving (4-8 weeks)</li>
              <li>IT Support / CompTIA A+ (8-12 weeks)</li>
              <li>Healthcare certifications (CNA, Medical Assistant)</li>
              <li>Skilled trades (Welding, Electrical, Plumbing)</li>
            </ul>

            <h2>Application Process</h2>
            <ol>
              <li>Obtain a referral from your probation/parole officer or case manager</li>
              <li>Complete the online application at <Link href="/apply" className="text-blue-600">elevateforhumanity.org/apply</Link></li>
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
              In addition to training, JRI participants may access wraparound support services including
              housing referrals, mental health resources, substance abuse counseling, and financial literacy
              workshops. These services are coordinated through our case management team.
            </p>
          </div>

          {/* Contact */}
          <div className="mt-12 bg-slate-50 rounded-xl p-8 border">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions About JRI?</h2>
            <p className="text-gray-600 mb-6">Contact our enrollment team for more information about JRI eligibility and available programs.</p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:elevate4humanityedu@gmail.com" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                <Mail className="w-4 h-4" /> Email Us
              </a>
              <a href="tel:317-314-3757" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">
                <Phone className="w-4 h-4" /> (317) 314-3757
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
