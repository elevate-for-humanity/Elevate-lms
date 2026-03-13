import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { DollarSign, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'WIOA Eligibility - Public Assistance Recipients | Elevate for Humanity',
  description: 'SNAP, TANF, and SSI recipients automatically qualify for WIOA-funded career training.',
};

export const dynamic = 'force-dynamic';

export default async function PublicAssistancePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get programs
  const { data: programs } = await db
    .from('programs')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .eq('accepts_wioa', true)
    .limit(6);

  const qualifyingPrograms = [
    { name: 'SNAP', full: 'Supplemental Nutrition Assistance Program (Food Stamps)' },
    { name: 'TANF', full: 'Temporary Assistance for Needy Families' },
    { name: 'SSI', full: 'Supplemental Security Income' },
    { name: 'SSDI', full: 'Social Security Disability Insurance' },
    { name: 'Medicaid', full: 'Indiana Health Coverage Programs' },
    { name: 'HUD', full: 'Housing Assistance / Section 8' },
  ];

  const benefits = [
    'Automatic income eligibility - no additional verification needed',
    'Funded training - tuition, books, and supplies covered for eligible participants',
    'Priority enrollment in high-demand programs',
    'Career counseling and job placement assistance',
    'Support services (transportation, childcare assistance)',
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'WIOA Eligibility', href: '/wioa-eligibility' }, { label: 'Public Assistance' }]} />
        </div>
      </div>

      <section className="bg-brand-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Public Assistance Recipients
          </h1>
          <p className="text-xl text-brand-green-100">
            If you receive public assistance, you automatically qualify for WIOA funding
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/wioa-eligibility" className="text-brand-blue-600 hover:underline mb-6 inline-block">
          ← Back to WIOA Eligibility
        </Link>

        {/* Qualifying Programs */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Qualifying Assistance Programs</h2>
          <p className="text-gray-600 mb-6">
            If you currently receive any of the following, you automatically meet 
            WIOA income eligibility requirements:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {qualifyingPrograms.map((program, index) => (
              <div key={index} className="bg-brand-green-50 rounded-lg p-4">
                <div className="font-bold text-brand-green-700">{program.name}</div>
                <div className="text-sm text-gray-600">{program.full}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What You Get</h2>
          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Required Documents */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Required Documents</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Proof of public assistance (award letter, benefit statement, or EBT card)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Valid government-issued ID</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Proof of Indiana residency</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Social Security number (entered online)</span>
            </li>
          </ul>
        </div>

        {/* Programs */}
        {programs && programs.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Available Training Programs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {programs.map((program: any) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug || program.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <h3 className="font-semibold">{program.name}</h3>
                  {program.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{program.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand-green-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Start Your Career?</h3>
          <p className="text-brand-green-100 mb-6">
            Apply today - your public assistance status qualifies you for free training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-white text-brand-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-green-700 transition"
            >
              <Phone className="w-5 h-5" />
              Get Help Online
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
