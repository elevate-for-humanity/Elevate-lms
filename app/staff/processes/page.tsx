import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { BookOpen, Search, FileText, Clock, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/staff-portal/processes',
  },
  title: 'Process Documentation',
  description: 'Access step-by-step guides for all internal processes.',
};

export default async function ProcessesPage() {
  const { user, profile } = await requireRole(['staff', 'admin', 'super_admin', 'advisor']);
  const supabase = await createClient();

  const { data: processes, error } = await supabase
    .from('staff_processes')
    .select('*')
    .order('name');

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">Process Documentation</h1>
              <p className="text-black mt-2">Step-by-step guides for all procedures</p>
            </div>
            <Link
              href="/admin/staff-portal/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Error loading processes: {error.message}</p>
          </div>
        )}

        {!processes || processes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-black mb-2">No Processes Available</h3>
            <p className="text-black">Process documentation will appear here once added.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map((process) => (
              <div
                key={process.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">{process.name}</h3>
                  {process.category && (
                    <span className="px-2 py-2 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {process.category}
                    </span>
                  )}
                </div>

                {process.description && (
                  <p className="text-black text-sm mb-4">{process.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {process.average_time && (
                    <div className="flex items-center gap-2 text-sm text-black">
                      <Clock className="h-4 w-4" />
                      <span>~{process.average_time} minutes</span>
                    </div>
                  )}
                  {process.completion_rate && (
                    <div className="flex items-center gap-2 text-sm text-black">
                      <TrendingUp className="h-4 w-4" />
                      <span>{process.completion_rate}% success rate</span>
                    </div>
                  )}
                  {process.process_steps && (
                    <div className="flex items-center gap-2 text-sm text-black">
                      <FileText className="h-4 w-4" />
                      <span>{process.process_steps.length} steps</span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/staff-portal/processes/${process.id}`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Process
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
