export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Career Pathways | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Explore career pathways and advancement opportunities.',
};

const PATHWAYS = [
  { title: 'Healthcare', programs: ['CNA', 'Medical Assistant', 'QMA'] },
  { title: 'Skilled Trades', programs: ['HVAC', 'Electrical', 'Plumbing', 'Welding'] },
  { title: 'Business', programs: ['Bookkeeping', 'Finance'] },
];

export default function PathwaysPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Career Pathways</h1>
          <p className="text-xl text-blue-100">Build your career step by step with our programs.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {PATHWAYS.map((pathway) => (
              <div key={pathway.title} className="bg-white p-8 rounded-xl border border-slate-200">
                <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-4">{pathway.title}</h3>
                <ul className="space-y-2">
                  {pathway.programs.map((p) => (
                    <li key={p} className="text-slate-600">• {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/programs" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700">
              Explore Programs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

