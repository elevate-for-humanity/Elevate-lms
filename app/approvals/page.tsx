import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Approvals | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/approvals',
  },
};

import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Award,
  Building2,
  Shield,
  Users,
  FileCheck,
} from 'lucide-react';

export default function ApprovalsPage() {
  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Approvals" }]} />
      </div>
{/* Hero Section with Background Image */}
      <section className="relative h-[500px] w-full overflow-hidden">
        <Image
          src="/images/programs/cpr-group-training-hd.jpg"
          alt="Official documents and certifications"
          fill
          className="object-cover"
          priority
          quality={100}
          sizes="100vw"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              Approvals, Credentials & Partnerships
            </h1>
            <p className="text-base md:text-lg text-slate-200 leading-relaxed drop-shadow-lg">
              Elevate For Humanity operates under Selfish Inc, a 501(c)(3)
              nonprofit and registered federal contractor. Together, our
              entities form a multi-industry-standard workforce ecosystem that
              is approved by state and federal agencies to deliver training,
              apprenticeships, and workforce services.
            </p>
          </div>
        </div>
      </section>

      {/* State & Workforce Approvals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Shield className="w-12 h-12 text-brand-blue-600" />
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              State & Workforce Approvals
            </h2>
          </div>

          <div className="space-y-8">
            {/* INTraining */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    INTraining Approved Provider – Indiana Department of
                    Workforce Development
                  </h3>
                  <div className="space-y-2 text-lg text-black">
                    <p>
                      <strong>Program:</strong> Emergency Health & Safety
                      Technician
                    </p>
                    <p>
                      <strong>Program Location ID:</strong> 10004621
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ETPL */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Eligible Training Provider (ETP) – WIOA-funded training
                  </h3>
                  <p className="text-lg text-black">
                    Approved to serve participants funded through the Workforce
                    Innovation and Opportunity Act (WIOA)
                  </p>
                </div>
              </div>
            </div>

            {/* WRG */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Workforce Ready Grant (WRG) Training Provider
                  </h3>
                  <p className="text-lg text-black">
                    Selected programs available at no cost to eligible adults
                    through Indiana's Workforce Ready Grant
                  </p>
                </div>
              </div>
            </div>

            {/* JRI */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Job Ready Indy (JRI) Training Partner – Marion County
                  </h3>
                  <p className="text-lg text-black">
                    Approved partner for Job Ready Indy workforce readiness
                    training in Marion County
                  </p>
                </div>
              </div>
            </div>

            {/* ITAP */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    ITAP / INDOT Registration
                  </h3>
                  <p className="text-lg text-black">
                    2Exclusive LLC-S registered with INDOT's ITAP for
                    transportation and construction-aligned workforce services
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Federal Approvals */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Building2 className="w-12 h-12 text-brand-orange-600" />
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Federal Approvals & Registration
            </h2>
          </div>

          <div className="space-y-8">
            {/* DOL Apprenticeship */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-red-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    U.S. Department of Labor Registered Apprenticeship Sponsor
                  </h3>
                  <div className="space-y-2 text-lg text-black">
                    <p>
                      <strong>Program:</strong> Emergency Health & Safety
                      Technician
                    </p>
                    <p>
                      <strong>RAPIDS Program ID:</strong> 2025-IN-132301
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SAM.gov */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-red-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    SAM.gov Active Federal Contractor (Selfish Inc)
                  </h3>
                  <div className="space-y-2 text-lg text-black">
                    <p>
                      <strong>UEI:</strong> VX2GK5S8SZH8
                    </p>
                    <p>
                      <strong>CAGE:</strong> 0Q856
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certification & Testing Partnerships */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Award className="w-12 h-12 text-brand-orange-600" />
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Certification & Testing Partnerships
            </h2>
          </div>

          <div className="space-y-8">
            {/* Certiport */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-orange-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Certiport Authorized Testing Center
                  </h3>
                  <p className="text-lg text-black mb-4">
                    Authorized to administer industry-standard-recognized
                    certification exams for:
                  </p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span> Microsoft
                      Office Specialist (MOS)
                    </li>
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span> IC3
                      Digital Literacy
                    </li>
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span> IT
                      Specialist (Networking, Security, Python, Databases,
                      HTML/CSS/JS)
                    </li>
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span> Adobe
                      Certified Professional
                    </li>
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span>{' '}
                      Entrepreneurship & Small Business (ESB)
                    </li>
                    <li className="flex items-center gap-2 text-black">
                      <span className="text-brand-green-600">•</span>{' '}
                      Communication Skills for Business (CSB)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Milady RISE */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-orange-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Milady RISE Partner School – Client Well-Being & Safety
                    Certification
                  </h3>
                  <p className="text-lg text-black mb-3">
                    Training in domestic violence awareness, human trafficking
                    awareness, and infection control (2-hour course)
                  </p>
                  <p className="text-black">
                    <strong>School promo code:</strong>{' '}
                    <code className="bg-slate-200 px-2 py-2 rounded">
                      efhcti-rise295
                    </code>{' '}
                    (for enrolled students and staff)
                  </p>
                </div>
              </div>
            </div>

            {/* CareerSafe */}
            <div className="bg-slate-50 rounded-2xl p-8 border-l-4 border-brand-orange-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    CareerSafe / OSHA-aligned Safety Training
                  </h3>
                  <p className="text-lg text-black">
                    Integrated into trades and safety pathways for workplace
                    safety certification
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nonprofit & Diversity Certifications */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <Users className="w-12 h-12 text-blue-600" />
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Nonprofit & Diversity Certifications
            </h2>
          </div>

          <div className="space-y-8">
            {/* 501(c)(3) */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    501(c)(3) Nonprofit – Selfish Inc
                  </h3>
                  <p className="text-lg text-black">
                    IRS-recognized tax-exempt charitable organization
                  </p>
                </div>
              </div>
            </div>

            {/* Candid */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    Candid/Guidestar Registered Nonprofit
                  </h3>
                  <p className="text-lg text-black">
                    Verified nonprofit profile on the nation's leading nonprofit
                    information platform
                  </p>
                </div>
              </div>
            </div>

            {/* ByBlack */}
            <div className="bg-white rounded-2xl p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg md:text-lg font-bold mb-3">
                    ByBlack Certified Black-Owned Business
                  </h3>
                  <p className="text-lg text-black">
                    Certified by U.S. Black Chambers & ByBlack.us
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-20 bg-brand-blue-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-12">
            <FileCheck className="w-12 h-12 text-white" />
            <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-white text-2xl md:text-3xl lg:text-2xl md:text-3xl">
              Why This Matters
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-lg md:text-lg font-bold text-white mb-4">
                For Students
              </h3>
              <p className="text-black text-lg leading-relaxed">
                Our students can access funded training through WRG, WIOA, JRI,
                and apprenticeships. Your training is legitimate, recognized,
                and leads to real employment.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-lg md:text-lg font-bold text-white mb-4">
                For Employers
              </h3>
              <p className="text-black text-lg leading-relaxed">
                Our employers can trust that our programs are standards-aligned
                and reportable. Graduates meet industry-standard requirements
                and are job-ready from day one.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-lg md:text-lg font-bold text-white mb-4">
                For Partners
              </h3>
              <p className="text-black text-lg leading-relaxed">
                Workforce boards, schools, reenstart programs, and community
                partners can confidently refer people to Elevate For Humanity
                knowing we meet state and federal quality benchmarks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold mb-6 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg text-black mb-8 leading-relaxed">
            Join thousands of students who have transformed their careers
            through our state-approved, federally recognized training programs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-full hover:bg-brand-orange-700 transition-all shadow-lg"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="px-8 py-4 bg-slate-100 text-black font-bold rounded-full hover:bg-slate-200 transition-all shadow-lg"
            >
              View Programs
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-slate-100 text-black font-bold rounded-full hover:bg-slate-200 transition-all shadow-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
