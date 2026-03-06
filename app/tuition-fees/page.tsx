import { Metadata } from 'next';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Tuition & Fees | Elevate for Humanity',
  description: 'Complete tuition and fee schedule for all programs at Elevate for Humanity. Transparent pricing with no hidden costs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/tuition-fees',
  },
};

export const dynamic = 'force-dynamic';

export default async function TuitionFeesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  // Fetch programs from database
  const { data: dbPrograms } = await db
    .from('training_programs')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Static program data — authoritative tuition schedule
  // DB programs supplement this if tuition_cost is populated
  const STATIC_PROGRAMS = [
    { name: 'Barber Apprenticeship', duration: '52 weeks', tuition: 0, examFees: 75, examFeesNote: 'Indiana PSI barber exam', materials: 0, fundingType: 'DOL Registered Apprenticeship' },
    { name: 'Cosmetology Apprenticeship', duration: '52 weeks', tuition: 0, examFees: 75, examFeesNote: 'Indiana PSI cosmetology exam', materials: 0, fundingType: 'DOL Registered Apprenticeship' },
    { name: 'Esthetician Apprenticeship', duration: '36 weeks', tuition: 0, examFees: 75, examFeesNote: 'Indiana PSI esthetician exam', materials: 0, fundingType: 'DOL Registered Apprenticeship' },
    { name: 'Nail Technician Apprenticeship', duration: '24 weeks', tuition: 0, examFees: 75, examFeesNote: 'Indiana PSI nail tech exam', materials: 0, fundingType: 'DOL Registered Apprenticeship' },
    { name: 'CNA Certification', duration: '6 weeks', tuition: 0, examFees: 115, examFeesNote: 'Pearson VUE CNA exam', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'CDL Training (Class A)', duration: '4 weeks', tuition: 0, examFees: 50, examFeesNote: 'Indiana BMV CDL skills test', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Building Technician with HVAC Fundamentals', duration: '12 weeks', tuition: 0, examFees: 150, examFeesNote: 'EPA 608 certification', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Electrical Technician', duration: '12 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Plumbing Technician', duration: '12 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Welding', duration: '10 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Phlebotomy Technician', duration: '8 weeks', tuition: 1795, examFees: 135, examFeesNote: 'NHA CPT exam', materials: 75, fundingType: 'Self-Pay · BNPL Available' },
    { name: 'Medical Assistant', duration: '16 weeks', tuition: 0, examFees: 155, examFeesNote: 'NHA CCMA exam', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Tax Preparation', duration: '8 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'Grant-Funded' },
    { name: 'Web Development', duration: '16 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'Cybersecurity Fundamentals', duration: '12 weeks', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'WIOA / WRG Eligible' },
    { name: 'CPR / First Aid (HSI)', duration: '1 day', tuition: 0, examFees: 0, examFeesNote: '', materials: 0, fundingType: 'Included with programs' },
  ];

  // Use DB data if tuition fields are populated, otherwise use static
  const dbMapped = (dbPrograms || [])
    .filter((p: any) => p.tuition_cost != null && p.tuition_cost > 0)
    .map((p: any) => ({
      name: p.name,
      duration: p.duration_weeks ? `${p.duration_weeks} weeks` : p.duration || 'Varies',
      tuition: p.tuition_cost || 0,
      examFees: p.exam_fee || 0,
      examFeesNote: p.exam_fee_note || 'Third-party certification exam',
      materials: p.materials_cost || 0,
      fundingType: p.funding_type || 'Self-Pay',
    }));

  const programs = dbMapped.length > 0
    ? dbMapped
    : STATIC_PROGRAMS.map(p => ({ ...p, total: p.tuition + p.examFees + p.materials }));

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Tuition & Fees' }]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px]">
        <Image src="/images/pages/tuition-fees-page-1.jpg" alt="Tuition and fee information" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Tuition & Fees Schedule</h1>
          <p className="text-xl text-gray-300">
            Most programs are grant-funded or employer-sponsored at no cost to eligible students.
            Third-party exam fees may apply.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Important Notice */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-2">Important Information</h2>
          <ul className="text-gray-700 space-y-2">
            <li>• All tuition amounts are fixed and not subject to change during your enrollment period</li>
            <li>• Third-party exam fees are paid directly to the certifying body and are subject to change</li>
            <li>• Funding eligibility (WIOA/WRG) is determined by your local workforce agency, not by Elevate for Humanity</li>
            <li>• See our <Link href="/refund-policy" className="text-brand-orange-600 hover:underline">Refund Policy</Link> for cancellation terms</li>
          </ul>
        </div>

        {/* Program Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-left p-4 font-bold">Program</th>
                <th className="text-left p-4 font-bold">Duration</th>
                <th className="text-right p-4 font-bold">Tuition</th>
                <th className="text-right p-4 font-bold">Exam Fees*</th>
                <th className="text-right p-4 font-bold">Materials</th>
                <th className="text-right p-4 font-bold">Total Cost</th>
                <th className="text-left p-4 font-bold">Funding</th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Program schedule is being updated. <Link href="/programs" className="text-brand-orange-600 hover:underline">View active programs</Link> or <Link href="/contact" className="text-brand-orange-600 hover:underline">contact us</Link> for current pricing.
                  </td>
                </tr>
              ) : (
                programs.map((program: any, index: number) => (
                  <tr key={program.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium text-gray-900">{program.name}</td>
                    <td className="p-4 text-gray-700">{program.duration}</td>
                    <td className="p-4 text-right text-gray-900">${program.tuition.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-700">
                      {program.examFees > 0 ? `$${program.examFees}` : '—'}
                    </td>
                    <td className="p-4 text-right text-gray-700">
                      {program.materials > 0 ? `$${program.materials}` : '—'}
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900">${program.total.toLocaleString()}</td>
                    <td className="p-4 text-gray-700 text-sm">{program.fundingType}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Exam Fees Explanation */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">*Third-Party Exam Fees</h3>
          <p className="text-gray-700 mb-4">
            Some programs prepare students for industry certification exams administered by third parties. 
            These fees are paid directly to the certifying organization and are not collected by Elevate for Humanity.
          </p>
          <ul className="text-gray-700 space-y-2 text-sm">
            {programs.filter((p: any) => p.examFees > 0).map((program: any) => (
              <li key={program.name}>
                <strong>{program.name}:</strong> {program.examFeesNote} — ${program.examFees}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Options */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Options</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Pay in Full</h3>
              <p className="text-gray-700 text-sm">
                Pay the full tuition amount at enrollment. No additional fees.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Payment Plan</h3>
              <p className="text-gray-700 text-sm">
                Split your tuition into monthly payments. Down payment required at enrollment. 
                No interest charged.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Workforce Funding</h3>
              <p className="text-gray-700 text-sm">
                Eligible programs may be funded through WIOA or WRG. Contact your local 
                WorkOne office to determine eligibility.
              </p>
            </div>
          </div>
        </section>

        {/* Additional Fees */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">What's Included in Tuition</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• All instruction (online and in-person)</li>
              <li>• Access to Learning Management System (LMS)</li>
              <li>• Course materials and handouts</li>
              <li>• Career services and job placement assistance</li>
              <li>• Certificate of Completion upon successful program completion</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mt-4">
            <h3 className="font-bold text-gray-900 mb-4">Not Included in Tuition</h3>
            <ul className="text-gray-700 space-y-2">
              <li>• Third-party certification exam fees (listed above)</li>
              <li>• Background checks required by employers (varies)</li>
              <li>• Drug screening required by employers (varies)</li>
              <li>• Transportation to training sites</li>
              <li>• Personal protective equipment beyond program-provided items</li>
            </ul>
          </div>
        </section>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-gray-600 mb-4">
            Questions about tuition or payment options? Contact us at Get Help Online or our contact form
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/disclosures" className="text-brand-orange-600 hover:underline">Student Disclosures</Link>
            <Link href="/refund-policy" className="text-brand-orange-600 hover:underline">Refund Policy</Link>
            <Link href="/enrollment-agreement" className="text-brand-orange-600 hover:underline">Enrollment Agreement</Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
