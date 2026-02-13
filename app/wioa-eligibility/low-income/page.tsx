import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { CheckCircle, DollarSign, Phone, Users } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'WIOA Eligibility - Low Income Guidelines | Elevate for Humanity',
  description: 'Check if your household income qualifies you for free WIOA-funded career training.',
};

export const dynamic = 'force-dynamic';

export default async function LowIncomePage() {
  const supabase = await createClient();

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
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .eq('accepts_wioa', true)
    .limit(6);

  // 2024 WIOA Income Guidelines (70% of Lower Living Standard Income Level)
  const incomeGuidelines = [
    { size: 1, annual: 15060, monthly: 1255 },
    { size: 2, annual: 20440, monthly: 1703 },
    { size: 3, annual: 25820, monthly: 2152 },
    { size: 4, annual: 31200, monthly: 2600 },
    { size: 5, annual: 36580, monthly: 3048 },
    { size: 6, annual: 41960, monthly: 3497 },
  ];

  const additionalQualifiers = [
    'Homeless individuals',
    'Foster youth or youth aging out of foster care',
    'Individuals with disabilities',
    'Ex-offenders',
    'Migrant and seasonal farmworkers',
    'Single parents',
    'Displaced homemakers',
    'Long-term unemployed (27+ weeks)',
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'WIOA Eligibility', href: '/wioa-eligibility' }, { label: 'Low Income' }]} />
        </div>
      </div>

      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Low Income Guidelines
          </h1>
          <p className="text-xl text-blue-100">
            Check if your household income qualifies you for free training
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/wioa-eligibility" className="text-blue-600 hover:underline mb-6 inline-block">
          ← Back to WIOA Eligibility
        </Link>

        {/* Income Guidelines Table */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">2024 Income Guidelines</h2>
          <p className="text-gray-600 mb-6">
            You may qualify for WIOA funding if your household income is at or below 
            these levels (based on 70% of Lower Living Standard Income Level):
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left font-semibold">Household Size</th>
                  <th className="px-4 py-3 text-right font-semibold">Annual Income</th>
                  <th className="px-4 py-3 text-right font-semibold">Monthly Income</th>
                </tr>
              </thead>
              <tbody>
                {incomeGuidelines.map((row) => (
                  <tr key={row.size} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        {row.size} {row.size === 1 ? 'person' : 'people'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${row.annual.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ${row.monthly.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            * For households larger than 6, add $5,380 per additional person.
          </p>
        </div>

        {/* Additional Qualifiers */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Other Ways to Qualify</h2>
          <p className="text-gray-600 mb-6">
            Even if your income is above the guidelines, you may still qualify if you are:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {additionalQualifiers.map((qualifier, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{qualifier}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What Counts as Income */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">What Counts as Income?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-green-700 mb-3">Included:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Wages and salaries</li>
                <li>• Self-employment income</li>
                <li>• Unemployment benefits</li>
                <li>• Social Security benefits</li>
                <li>• Pension/retirement income</li>
                <li>• Child support received</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-700 mb-3">Not Included:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• SNAP/Food stamps</li>
                <li>• Housing assistance</li>
                <li>• One-time payments</li>
                <li>• Student financial aid</li>
                <li>• Tax refunds</li>
                <li>• Gifts</li>
              </ul>
            </div>
          </div>
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
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Not Sure If You Qualify?</h3>
          <p className="text-blue-100 mb-6">
            Apply anyway! We'll help determine your eligibility and find funding options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
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
