import { Metadata } from 'next';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

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
  
  // Fetch programs from database
  const { data: dbPrograms } = await supabase
    .from('training_programs')
    .select('*')
    .eq('is_active', true)
    .order('name');

  const programs = (dbPrograms || []).map((p: any) => ({
    name: p.name,
    duration: p.duration_weeks ? `${p.duration_weeks} weeks` : p.duration || 'Varies',
    tuition: p.tuition_cost || 0,
    examFees: p.exam_fee || 0,
    examFeesNote: p.exam_fee_note || 'Third-party certification exam',
    materials: p.materials_cost || 0,
    materialsNote: p.materials_note || 'Included in tuition',
    total: (p.tuition_cost || 0) + (p.exam_fee || 0) + (p.materials_cost || 0),
    fundingType: p.funding_type || 'Self-Pay',
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Tuition & Fees' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Tuition & Fees Schedule</h1>
          <p className="text-xl text-gray-300">
            Transparent pricing for all programs. Effective January 2026.
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
            <li>• See our <Link href="/refund-policy" className="text-orange-600 hover:underline">Refund Policy</Link> for cancellation terms</li>
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
                    No programs available at this time.
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
            Questions about tuition or payment options? Contact us at Get Help Online or info@elevateforhumanity.org
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/disclosures" className="text-orange-600 hover:underline">Student Disclosures</Link>
            <Link href="/refund-policy" className="text-orange-600 hover:underline">Refund Policy</Link>
            <Link href="/enrollment-agreement" className="text-orange-600 hover:underline">Enrollment Agreement</Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
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
