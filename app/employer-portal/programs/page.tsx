export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';
import { Award, DollarSign, Users, Clock, ArrowRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const metadata: Metadata = {
  title: 'Employer Programs | Employer Portal',
  description: 'Explore tax credit programs, apprenticeships, and workforce development opportunities.',
  robots: { index: false, follow: false },
};


export default async function EmployerProgramsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('employers').select('*').limit(50);
const programs = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Programs" }]} />
<div className="relative h-64 bg-brand-blue-800 overflow-hidden">
        <Image
          src="/images/pages/employer-portal-page-3.jpg"
          alt="Employer programs"
          fill
          className="object-cover opacity-20"
        />
        
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: DollarSign, label: 'WOTC Credit per Hire', value: 'Up to $9,600', color: 'brand-green' },
            { icon: Users, label: 'OJT Wage Reimbursement', value: '50–75%', color: 'brand-blue' },
            { icon: Award, label: 'Available Programs', value: '4', color: 'brand-blue' },
            { icon: Clock, label: 'Avg. Processing Time', value: '2–4 weeks', color: 'brand-orange' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {programs.map((program) => (
            <div key={program.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{program.name}</h2>
                    <span className="px-3 py-1 bg-brand-green-100 text-brand-green-700 text-sm font-medium rounded-full">
                      {program.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-6">{program.description}</p>
                  
                  <div className="flex items-center gap-8 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Potential Savings</p>
                      <p className="text-xl font-bold text-brand-green-600">{program.savings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Eligibility</p>
                      <div className="flex flex-wrap gap-2">
                        {program.eligibility.map((item, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link
                      href={`/employer-portal/programs/${program.id}`}
                      className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href="/apply" className="px-6 py-3 border border-brand-blue-600 text-brand-blue-600 rounded-lg hover:bg-brand-blue-50 transition">
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-brand-blue-600 rounded-2xl p-8 text-white">
          <div className="md:flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help Choosing a Program?</h3>
              <p className="text-brand-blue-200">Our team can analyze your hiring needs and recommend the best incentives.</p>
            </div>
            <Link
              href="/contact"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Schedule Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
