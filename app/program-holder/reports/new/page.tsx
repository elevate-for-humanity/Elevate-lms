import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Calendar, Clock, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Report | Program Holder Portal',
  description: 'Submit a new compliance report',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/reports/new',
  },
};

export default async function NewReportPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Reports" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  // Get program holder record
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id, organization_name')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/apply');
  }

  // Get active students for the report
  const { data: students } = await supabase
    .from('program_holder_students')
    .select('*, student:profiles!student_id(first_name, last_name)')
    .eq('program_holder_id', programHolder.id)
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Reports" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[300px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/how-it-works-hero.jpg"
          alt="New Report"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Submit New Report
          </h1>
          <p className="text-lg text-gray-100">
            {programHolder.organization_name}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <form method="POST">
                {/* Report Period */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-6">
                    Report Period
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Week Ending Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="date"
                          name="week_ending"
                          required
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Total Hours This Week
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          type="number"
                          name="hours_worked"
                          min="0"
                          step="0.5"
                          required
                          placeholder="40"
                          className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Information */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-6">
                    Student Progress
                  </h2>
                  {students && students.length > 0 ? (
                    <div className="space-y-4">
                      {students.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="font-medium text-black mb-2">
                            {enrollment.student?.first_name}{' '}
                            {enrollment.student?.last_name}
                          </div>
                          <textarea
                            name={`student_${enrollment.id}_notes`}
                            rows={2}
                            placeholder="Progress notes for this student..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-black">
                      No active students to report on.
                    </p>
                  )}
                </div>

                {/* Activities & Notes */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-6">
                    Activities & Notes
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Skills Practiced
                      </label>
                      <textarea
                        name="skills_practiced"
                        rows={3}
                        placeholder="Describe the skills and competencies practiced this week..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Challenges or Issues
                      </label>
                      <textarea
                        name="challenges"
                        rows={3}
                        placeholder="Note any challenges, concerns, or issues that arose..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        rows={4}
                        placeholder="Any additional information or observations..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/program-holder/reports"
                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save Report (Contact Support)
                  </Link>
                  <Link
                    href="/program-holder/reports"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-slate-50 text-black font-semibold rounded-lg border-2 border-slate-300 transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </form>

              {/* Note about submission */}
              <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                <p className="text-sm text-brand-blue-800">
                  <strong>Note:</strong> Report submission is currently handled
                  manually. Please contact support at{' '}
                  <a
                    href="mailto:elevate4humanityedu@gmail.com"
                    className="underline"
                  >
                    elevate4humanityedu@gmail.com
                  </a>{' '}
                  to submit your report.
                </p>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-brand-blue-900 mb-2">
                Reporting Guidelines
              </h3>
              <ul className="text-brand-blue-800 space-y-2 text-sm">
                <li>• Reports are due every Monday for the previous week</li>
                <li>
                  • Include total hours worked and progress for each student
                </li>
                <li>• Note any challenges or concerns that need attention</li>
                <li>
                  • Contact support if you need help completing this report
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
