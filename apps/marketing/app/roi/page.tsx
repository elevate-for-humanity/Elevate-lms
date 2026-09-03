import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  TrendingUp, Users, Clock, DollarSign, Target, Award,
  BarChart3, Shield, CheckCircle, ArrowRight, Building,
  GraduationCap, Briefcase, FileText, PieChart, Zap,
  HeartHandshake, Recycle, Database, AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'ROI & Value',
  keywords: ["ROI", "return on investment", "workforce development", "cost savings", "efficiency", "outcomes"],
  description: 'See the return on investment for workforce agencies, schools, and employers using Elevate. Measurable improvements in efficiency and outcomes.',
};

const customerSegments = [
  {
    id: 'workforce',
    name: 'Workforce Agencies',
    icon: Building,
    color: 'brand-blue',
    challenges: [
      'Manual tracking of participant progress',
      'Complex WIOA compliance reporting',
      'Limited visibility into outcomes',
      'Time-consuming data entry across systems'
    ],
    solutions: [
      'Automated participant tracking',
      'Built-in WIOA reporting',
      'Real-time outcome dashboards',
      'Single system for all data'
    ],
    metrics: [
      { label: 'Time Saved Weekly', value: '15+', unit: 'hours' },
      { label: 'Reporting Time', value: '80%', unit: 'faster' },
      { label: 'Data Accuracy', value: '99%', unit: 'improved' },
      { label: 'Participant Capacity', value: '3x', unit: 'increase' }
    ]
  },
  {
    id: 'schools',
    name: 'Schools & Colleges',
    icon: GraduationCap,
    color: 'brand-orange',
    challenges: [
      'Slow program launch processes',
      'Difficult student progress tracking',
      'Credential management complexity',
      'Employer connection gaps'
    ],
    solutions: [
      'Pre-built program templates',
      'Real-time student dashboards',
      'Automated credential issuance',
      'Direct employer pipeline'
    ],
    metrics: [
      { label: 'Program Launch', value: '40%', unit: 'faster' },
      { label: 'Student Completion', value: '25%', unit: 'increase' },
      { label: 'Credential Issuance', value: '90%', unit: 'faster' },
      { label: 'Employer Partners', value: '5x', unit: 'more' }
    ]
  },
  {
    id: 'employers',
    name: 'Employers',
    icon: Briefcase,
    color: 'emerald',
    challenges: [
      'Finding skilled talent',
      'Managing apprenticeship programs',
      'Tracking employee certifications',
      'Compliance documentation burden'
    ],
    solutions: [
      'Pre-screened candidate pipeline',
      'Complete apprenticeship management',
      'Digital credential verification',
      'Automated compliance records'
    ],
    metrics: [
      { label: 'Hiring Time', value: '50%', unit: 'reduced' },
      { label: 'Training Costs', value: '30%', unit: 'saved' },
      { label: 'Compliance Audit', value: '100%', unit: 'pass rate' },
      { label: 'Employee Retention', value: '40%', unit: 'higher' }
    ]
  }
];

export default function ROIPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/barber-professional.webp" alt="Return on investment - Elevate for Humanity workforce solutions" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Proven Results
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Measure What Matters
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Workforce development leaders choose Elevate because they see measurable improvements 
              in efficiency, outcomes, and return on investment. Here's what our partners achieve.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demos" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                See It In Action <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Calculate Your ROI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Aggregate Stats */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">40%</div>
              <p className="text-slate-600">Faster Program Launch</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">60%</div>
              <p className="text-slate-600">Less Admin Time</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">3x</div>
              <p className="text-slate-600">More Participants</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">95%</div>
              <p className="text-slate-600">Completion Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Segment-Specific Value Props */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Value By Organization Type
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every organization type faces unique challenges. See how Elevate addresses yours.
            </p>
          </div>

          {/* Tabs for Mobile */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {customerSegments.map((segment) => (
              <button
                key={segment.id}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  segment.id === 'workforce' 
                    ? 'bg-brand-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <segment.icon className="w-5 h-5" />
                {segment.name}
              </button>
            ))}
          </div>

          {/* Workforce Agencies */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-16">
            <div className="bg-brand-blue-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">For Workforce Agencies</h3>
                  <p className="text-blue-100">Reduce manual tracking. Manage participants. Track outcomes.</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Challenges We Solve
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[0].challenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-600 text-xs font-bold">{i + 1}</span>
                        </div>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    How Elevate Helps
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[0].solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6 text-center">Measurable Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customerSegments[0].metrics.map((metric, i) => (
                    <div key={i} className="bg-brand-blue-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-brand-blue-600">{metric.value}</div>
                      <div className="text-sm text-slate-600">{metric.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schools */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-16">
            <div className="bg-brand-orange-500 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">For Schools & Colleges</h3>
                  <p className="text-orange-100">Launch programs faster. Manage students. Connect to employers.</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Challenges We Solve
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[1].challenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-600 text-xs font-bold">{i + 1}</span>
                        </div>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    How Elevate Helps
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[1].solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6 text-center">Measurable Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customerSegments[1].metrics.map((metric, i) => (
                    <div key={i} className="bg-orange-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">{metric.value}</div>
                      <div className="text-sm text-slate-600">{metric.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Employers */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-emerald-600 text-white p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">For Employers</h3>
                  <p className="text-emerald-100">Track apprentices. Build talent pipeline. Reduce compliance burden.</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Challenges We Solve
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[2].challenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-600 text-xs font-bold">{i + 1}</span>
                        </div>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    How Elevate Helps
                  </h4>
                  <ul className="space-y-3">
                    {customerSegments[2].solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-6 text-center">Measurable Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customerSegments[2].metrics.map((metric, i) => (
                    <div key={i} className="bg-emerald-50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-emerald-600">{metric.value}</div>
                      <div className="text-sm text-slate-600">{metric.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Cost of Doing Nothing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              The hidden costs of manual processes add up faster than you think.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Without Elevate
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Spreadsheets and paper files</p>
                    <p className="text-sm text-slate-600">Hours lost to data entry and filing</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Multiple disconnected systems</p>
                    <p className="text-sm text-slate-600">Duplicated data, sync errors, confusion</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Manual compliance reports</p>
                    <p className="text-sm text-slate-600">Days spent compiling data for audits</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">No real-time visibility</p>
                    <p className="text-sm text-slate-600">Reactive instead of proactive</p>
                  </div>
                </li>
              </ul>
              <div className="mt-8 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Estimated annual cost:</strong> $50,000-$100,000 in staff time, 
                  compliance risks, and missed opportunities.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-green-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                With Elevate
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Single source of truth</p>
                    <p className="text-sm text-slate-600">Everything in one organized system</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Automated workflows</p>
                    <p className="text-sm text-slate-600">Less manual work, fewer errors</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">One-click reports</p>
                    <p className="text-sm text-slate-600">WIOA, DOL, and custom reports instantly</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Real-time dashboards</p>
                    <p className="text-sm text-slate-600">See everything at a glance</p>
                  </div>
                </li>
              </ul>
              <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Platform cost:</strong> Starting at $399/month for Small Business. 
                  ROI achieved in the first month for most organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Dashboard Proof */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Reporting Dashboard Proof
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Show your board, funders, and stakeholders exactly what you're achieving.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Enrollment Numbers</h3>
              <p className="text-slate-600 text-sm">
                Track active participants, new enrollments, and pipeline by program.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Completion Rates</h3>
              <p className="text-slate-600 text-sm">
                Measure program completion, drop-out rates, and success factors.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Credentials Earned</h3>
              <p className="text-slate-600 text-sm">
                Track certifications issued, by type, and employer-recognized credentials.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Job Placement</h3>
              <p className="text-slate-600 text-sm">
                Monitor placement rates, wages, and employment duration.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Wages</h3>
              <p className="text-slate-600 text-sm">
                Report starting wages, wage growth, and earning trajectory.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Attendance</h3>
              <p className="text-slate-600 text-sm">
                Track attendance patterns and identify at-risk participants.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Demographics</h3>
              <p className="text-slate-600 text-sm">
                Report on participant demographics for compliance and funding.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Funding Reports</h3>
              <p className="text-slate-600 text-sm">
                WIOA, grants, and custom funding source reporting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to See Your ROI?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a personalized demo and get a custom ROI analysis for your organization.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demos" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Schedule Demo <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}