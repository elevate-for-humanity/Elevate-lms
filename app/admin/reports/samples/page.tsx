import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  FileText, 
  Download, 
  Users, 
  Award, 
  DollarSign,
  Calendar,
  ArrowLeft,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sample Reports | Admin | Elevate for Humanity',
  description: 'Download sample enrollment records, certificates, and funding reports.',
};

// Report format examples — shows admins what exported data looks like
const EXAMPLE_ENROLLMENT = {
  id: 'ENR-2026-00142',
  student: {
    name: 'Maria Rodriguez',
    email: 'maria.r@elevateforhumanity.org',
    phone: '(317) 314-3757',
    dob: '1995-03-15',
    ssn_last4: '4521',
  },
  program: {
    name: 'Certified Nursing Assistant (CNA)',
    code: 'CNA-101',
    duration: '6 weeks',
    hours: 120,
  },
  funding: {
    source: 'WIOA Adult',
    amount: 2850,
    provider: 'WorkOne Indy',
    case_number: 'WI-2026-08421',
  },
  dates: {
    application: '2026-01-02',
    enrollment: '2026-01-08',
    start: '2026-01-15',
    expected_completion: '2026-02-26',
  },
  status: 'Active',
};

// Sample certificate data
const EXAMPLE_CERTIFICATE = {
  id: 'CERT-2026-00089',
  student: {
    name: 'James Thompson',
    student_id: 'STU-2025-00312',
  },
  program: {
    name: 'HVAC Technician Apprenticeship',
    credential: 'HVAC Technician Certificate',
    hours_completed: 1500,
    hours_required: 1500,
  },
  completion: {
    date: '2026-01-10',
    grade: 'Pass',
    gpa: 3.45,
  },
  certifications: [
    { name: 'EPA 608 Universal', date: '2025-11-15', number: 'EPA-608-2025-44521' },
    { name: 'OSHA 10-Hour', date: '2025-08-20', number: 'OSHA10-2025-88742' },
  ],
  issued_by: 'Elevate for Humanity',
  issued_date: '2026-01-12',
  certificate_number: 'EFH-HVAC-2026-00089',
};

// Sample funding report data
const EXAMPLE_FUNDING_REPORT = {
  period: 'Q4 2025 (October - December)',
  generated: '2026-01-05',
  summary: {
    total_enrollments: 47,
    total_funding: 128450,
    completions: 38,
    placements: 32,
  },
  by_source: [
    { source: 'WIOA Adult', enrollments: 22, amount: 62700, completions: 18, placements: 15 },
    { source: 'WIOA Youth', enrollments: 8, amount: 24800, completions: 7, placements: 6 },
    { source: 'Workforce Ready Grant', enrollments: 12, amount: 31200, completions: 9, placements: 8 },
    { source: 'JRI', enrollments: 5, amount: 9750, completions: 4, placements: 3 },
  ],
  by_program: [
    { program: 'CNA', enrollments: 18, completions: 15, placement_rate: 87 },
    { program: 'Phlebotomy', enrollments: 12, completions: 10, placement_rate: 90 },
    { program: 'HVAC', enrollments: 8, completions: 6, placement_rate: 83 },
    { program: 'CDL', enrollments: 9, completions: 7, placement_rate: 86 },
  ],
};

export default function SampleReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Samples" }]} />
      </div>
{/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/admin/reports" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Sample Reports & Exports</h1>
          <p className="text-gray-600 mt-2">
            Example formats for enrollment records, certificates, and funding reports
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Sample Enrollment Record */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-brand-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6" />
              <h2 className="text-xl font-bold">Sample Enrollment Record</h2>
            </div>
            <button className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Student Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b">Student Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Enrollment ID</dt>
                    <dd className="font-mono font-medium">{EXAMPLE_ENROLLMENT.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium">{EXAMPLE_ENROLLMENT.student.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd>{EXAMPLE_ENROLLMENT.student.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd>{EXAMPLE_ENROLLMENT.student.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">DOB</dt>
                    <dd>{EXAMPLE_ENROLLMENT.student.dob}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">SSN (Last 4)</dt>
                    <dd>***-**-{EXAMPLE_ENROLLMENT.student.ssn_last4}</dd>
                  </div>
                </dl>
              </div>

              {/* Program Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b">Program Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Program</dt>
                    <dd className="font-medium">{EXAMPLE_ENROLLMENT.program.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Code</dt>
                    <dd className="font-mono">{EXAMPLE_ENROLLMENT.program.code}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Duration</dt>
                    <dd>{EXAMPLE_ENROLLMENT.program.duration}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Hours</dt>
                    <dd>{EXAMPLE_ENROLLMENT.program.hours}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Status</dt>
                    <dd>
                      <span className="inline-flex items-center gap-1 bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {EXAMPLE_ENROLLMENT.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Funding Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b">Funding Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Source</dt>
                    <dd className="font-medium">{EXAMPLE_ENROLLMENT.funding.source}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Amount</dt>
                    <dd className="font-medium text-brand-green-600">${EXAMPLE_ENROLLMENT.funding.amount.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Provider</dt>
                    <dd>{EXAMPLE_ENROLLMENT.funding.provider}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Case Number</dt>
                    <dd className="font-mono">{EXAMPLE_ENROLLMENT.funding.case_number}</dd>
                  </div>
                </dl>
              </div>

              {/* Dates */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b">Key Dates</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Application</dt>
                    <dd>{EXAMPLE_ENROLLMENT.dates.application}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Enrollment</dt>
                    <dd>{EXAMPLE_ENROLLMENT.dates.enrollment}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Start Date</dt>
                    <dd>{EXAMPLE_ENROLLMENT.dates.start}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Expected Completion</dt>
                    <dd>{EXAMPLE_ENROLLMENT.dates.expected_completion}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Sample Certificate */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-brand-blue-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <h2 className="text-xl font-bold">Sample Certificate Record</h2>
            </div>
            <button className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
          
          <div className="p-6">
            {/* Certificate Preview */}
            <div className="border-2 border-brand-blue-200 rounded-xl p-8 bg-brand-blue-50 mb-6">
              <div className="text-center">
                <div className="text-brand-blue-600 font-bold text-sm tracking-widest mb-2">CERTIFICATE OF COMPLETION</div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{EXAMPLE_CERTIFICATE.student.name}</h3>
                <p className="text-gray-600 mb-6">has successfully completed the</p>
                <h4 className="text-2xl font-bold text-brand-blue-700 mb-2">{EXAMPLE_CERTIFICATE.program.name}</h4>
                <p className="text-gray-600 mb-6">
                  completing {EXAMPLE_CERTIFICATE.program.hours_completed} hours of instruction and training
                </p>
                <div className="flex justify-center gap-8 text-sm text-gray-600 mb-6">
                  <div>
                    <div className="font-semibold">Completion Date</div>
                    <div>{EXAMPLE_CERTIFICATE.completion.date}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Certificate Number</div>
                    <div className="font-mono">{EXAMPLE_CERTIFICATE.certificate_number}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Issued by {EXAMPLE_CERTIFICATE.issued_by} on {EXAMPLE_CERTIFICATE.issued_date}
                </div>
              </div>
            </div>

            {/* Additional Certifications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Industry Certifications Earned</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {EXAMPLE_CERTIFICATE.certifications.map((cert) => (
                  <div key={cert.number} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="font-medium text-gray-900">{cert.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>Issued: {cert.date}</span>
                      <span className="mx-2">•</span>
                      <span className="font-mono">{cert.number}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sample Funding Report */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-brand-green-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" />
              <h2 className="text-xl font-bold">Sample Funding Source Report</h2>
            </div>
            <button className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
          
          <div className="p-6">
            {/* Report Header */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Report Period: {EXAMPLE_FUNDING_REPORT.period}</span>
              </div>
              <div className="text-sm text-gray-500">Generated: {EXAMPLE_FUNDING_REPORT.generated}</div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-blue-600">{EXAMPLE_FUNDING_REPORT.summary.total_enrollments}</div>
                <div className="text-sm text-brand-blue-700">Total Enrollments</div>
              </div>
              <div className="bg-brand-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-green-600">${(EXAMPLE_FUNDING_REPORT.summary.total_funding / 1000).toFixed(0)}K</div>
                <div className="text-sm text-brand-green-700">Total Funding</div>
              </div>
              <div className="bg-brand-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-blue-600">{EXAMPLE_FUNDING_REPORT.summary.completions}</div>
                <div className="text-sm text-brand-blue-700">Completions</div>
              </div>
              <div className="bg-brand-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-orange-600">{EXAMPLE_FUNDING_REPORT.summary.placements}</div>
                <div className="text-sm text-brand-orange-700">Job Placements</div>
              </div>
            </div>

            {/* By Funding Source */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">By Funding Source</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold">Source</th>
                      <th className="text-right px-4 py-3 font-semibold">Enrollments</th>
                      <th className="text-right px-4 py-3 font-semibold">Amount</th>
                      <th className="text-right px-4 py-3 font-semibold">Completions</th>
                      <th className="text-right px-4 py-3 font-semibold">Placements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE_FUNDING_REPORT.by_source.map((row) => (
                      <tr key={row.source} className="border-t">
                        <td className="px-4 py-3 font-medium">{row.source}</td>
                        <td className="px-4 py-3 text-right">{row.enrollments}</td>
                        <td className="px-4 py-3 text-right text-brand-green-600">${row.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{row.completions}</td>
                        <td className="px-4 py-3 text-right">{row.placements}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-50 font-semibold">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right">{EXAMPLE_FUNDING_REPORT.summary.total_enrollments}</td>
                      <td className="px-4 py-3 text-right text-brand-green-600">${EXAMPLE_FUNDING_REPORT.summary.total_funding.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{EXAMPLE_FUNDING_REPORT.summary.completions}</td>
                      <td className="px-4 py-3 text-right">{EXAMPLE_FUNDING_REPORT.summary.placements}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* By Program */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">By Program</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold">Program</th>
                      <th className="text-right px-4 py-3 font-semibold">Enrollments</th>
                      <th className="text-right px-4 py-3 font-semibold">Completions</th>
                      <th className="text-right px-4 py-3 font-semibold">Placement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE_FUNDING_REPORT.by_program.map((row) => (
                      <tr key={row.program} className="border-t">
                        <td className="px-4 py-3 font-medium">{row.program}</td>
                        <td className="px-4 py-3 text-right">{row.enrollments}</td>
                        <td className="px-4 py-3 text-right">{row.completions}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded text-xs font-medium">
                            {row.placement_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Template Format Notice</h3>
          <p className="text-yellow-700 text-sm">
            The records shown above are templates demonstrating the format and structure of 
            actual enrollment records, certificates, and funding reports. Real data is available 
            through the admin dashboard with appropriate access permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
