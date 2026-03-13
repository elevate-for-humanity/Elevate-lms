import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Elizabeth Greene | Our Team | Elevate for Humanity',
  description: 'Elizabeth Greene — Founder & Chief Executive Officer at Elevate for Humanity Career & Technical Institute.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Team', href: '/about/team' }, { label: 'Elizabeth Greene' }]} />
      </div>

      <section className="py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/about/team" className="inline-flex items-center text-sm text-slate-500 hover:text-brand-red-600 mb-8">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
          </Link>

          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-2">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/team/elizabeth-greene.jpg"
                  alt="Elizabeth Greene, Founder and CEO of Elevate for Humanity"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Elizabeth Greene</h1>
              <p className="text-brand-red-600 font-bold text-lg mb-6">Founder & Chief Executive Officer</p>
              <div className="text-slate-800 space-y-4 text-[16px] leading-relaxed">
                <p>Elizabeth Greene is a U.S. military veteran and the founder of Elevate for Humanity Career & Technical Institute, a workforce development organization in Indianapolis serving justice-involved individuals, low-income families, veterans, and anyone facing barriers to employment.</p>
                <p>She is an IRS Enrolled Agent (EA) holding both an EFIN and PTIN, authorized to represent taxpayers before the Internal Revenue Service. She is also a licensed barber through the Indiana Professional Licensing Agency, holds an Indiana Substitute Teacher License, and is OSHA 10-Hour Safety certified.</p>
                <p>Elizabeth is a certified proctor for EPA Section 608 refrigerant handling exams through both the ESCO Group (Proctor ID: 358010) and Mainstream Engineering, allowing Elevate to administer EPA certification exams on-site. She also operates a Certiport Authorized Testing Center (CATC) for industry certifications including Microsoft Office Specialist, IC3, and IT Specialist credentials.</p>
                <p>Under her leadership, Elevate for Humanity has secured approvals across federal, state, and local agencies. The organization is a U.S. Department of Labor Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301), listed on the Eligible Training Provider List (ETPL), and approved as a Workforce Ready Grant (WRG) provider. Elevate is WIOA and JRI funding approved, and partners with EmployIndy, Choice Medical CNA School, Milady, and the National Retail Federation Foundation (NRF Rise Up).</p>
                <p>The organization is enrolled in PECOS as a Medicare provider with a National Provider Identifier (NPI), registered as an Indiana State Bidder with a federal CAGE code, ITAP/INDOT registered, and ByBlack certified through the NAACP as a Black-owned business.</p>
                <p>Elizabeth also founded SupersonicFastCash, a tax preparation software company, and the RISE Foundation, a 501(c)(3) nonprofit providing philanthropic support for workforce development initiatives.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
