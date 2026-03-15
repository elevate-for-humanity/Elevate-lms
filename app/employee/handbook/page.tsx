import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, CheckCircle, ChevronRight, FileText, Shield, Users, Clock, AlertTriangle, Heart, Briefcase } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Employee Handbook | Elevate For Humanity',
  description: 'Elevate for Humanity employee policies, procedures, and guidelines.',
  robots: { index: false, follow: false },
};

// Static handbook sections — seeded here since handbook_sections table is empty
const HANDBOOK_SECTIONS = [
  {
    id: 'welcome',
    icon: Heart,
    color: 'brand-red',
    title: 'Welcome & Mission',
    summary: 'Our mission, values, and what it means to work at Elevate for Humanity.',
    content: [
      'Elevate for Humanity exists to connect people to funded workforce training and career pathways. Every team member plays a direct role in that mission.',
      'Our core values: Integrity, Equity, Excellence, and Community. These guide every decision we make.',
      'We are an equal opportunity employer. We do not discriminate on the basis of race, color, religion, sex, national origin, age, disability, or any other protected characteristic.',
    ],
  },
  {
    id: 'employment',
    icon: Briefcase,
    color: 'brand-blue',
    title: 'Employment Policies',
    summary: 'At-will employment, classifications, background checks, and probationary period.',
    content: [
      'All employment at Elevate for Humanity is at-will. Either party may terminate the employment relationship at any time, with or without cause or notice.',
      'New employees serve a 90-day introductory period. During this time, performance is evaluated and either party may end the relationship without additional process.',
      'All offers are contingent on successful completion of a background check and identity verification.',
      'Employee classifications: Full-Time (30+ hrs/week), Part-Time (<30 hrs/week), Contract/1099.',
    ],
  },
  {
    id: 'compensation',
    icon: CheckCircle,
    color: 'brand-green',
    title: 'Compensation & Payroll',
    summary: 'Pay schedules, methods, overtime, and direct deposit setup.',
    content: [
      'Payroll is processed bi-weekly. Pay dates fall on Fridays. If a pay date falls on a holiday, payment is made the preceding business day.',
      'Pay methods available: Direct Deposit (1–2 business days), Elevate Pay Card (same day), or Paper Check (pickup or mail).',
      'Overtime: Non-exempt employees are paid 1.5x their regular rate for hours worked over 40 in a workweek, per FLSA requirements.',
      'All employees must complete W-9 and payroll setup before their first paycheck can be issued.',
      'Pay stubs are available in the Employee Portal at /employee/payroll.',
    ],
  },
  {
    id: 'time',
    icon: Clock,
    color: 'brand-orange',
    title: 'Time Off & Leave',
    summary: 'PTO accrual, holidays, FMLA, and leave request procedures.',
    content: [
      'Full-time employees accrue PTO at 1.25 days per month (15 days/year). Part-time employees accrue on a pro-rated basis.',
      'Observed holidays: New Year\'s Day, MLK Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Thanksgiving (Thu & Fri), Christmas Day.',
      'FMLA: Eligible employees (12+ months, 1,250+ hours) may take up to 12 weeks of unpaid, job-protected leave per year.',
      'To request time off, submit a request in the Employee Portal at least 5 business days in advance for planned leave.',
      'Bereavement leave: 3 days for immediate family (spouse, child, parent, sibling). 1 day for extended family.',
    ],
  },
  {
    id: 'conduct',
    icon: Shield,
    color: 'brand-blue',
    title: 'Code of Conduct',
    summary: 'Professional standards, conflict of interest, social media, and disciplinary process.',
    content: [
      'All employees are expected to conduct themselves professionally and treat colleagues, students, and partners with respect.',
      'Harassment, discrimination, or retaliation of any kind will not be tolerated and may result in immediate termination.',
      'Conflict of interest: Employees must disclose any outside employment or financial interest that may conflict with their duties at Elevate.',
      'Social media: Do not post confidential information about students, partners, or internal operations. Identify yourself as an employee only when appropriate.',
      'Disciplinary process: Verbal warning → Written warning → Final written warning → Termination. Serious violations may skip steps.',
    ],
  },
  {
    id: 'safety',
    icon: AlertTriangle,
    color: 'brand-orange',
    title: 'Safety & Workplace',
    summary: 'Workplace safety, incident reporting, drug-free workplace, and emergency procedures.',
    content: [
      'Elevate for Humanity maintains a drug-free workplace. Use, possession, or distribution of controlled substances on company property is prohibited.',
      'All workplace injuries or incidents must be reported to HR within 24 hours, regardless of severity.',
      'Emergency procedures are posted at each office location. Familiarize yourself with evacuation routes on your first day.',
      'OSHA rights: You have the right to a safe workplace. Report unsafe conditions to your supervisor or HR without fear of retaliation.',
    ],
  },
  {
    id: 'benefits',
    icon: Users,
    color: 'brand-green',
    title: 'Benefits & Perks',
    summary: 'Health insurance, professional development, and employee assistance.',
    content: [
      'Full-time employees are eligible for health insurance benefits after 60 days of employment. Details provided during onboarding.',
      'Professional development: Employees may request up to $500/year for job-related training, certifications, or conferences.',
      'All employees have access to Elevate\'s LMS platform for free enrollment in any offered program.',
      'Employee Assistance Program (EAP): Confidential counseling and support services available to all employees.',
    ],
  },
  {
    id: 'ferpa',
    icon: FileText,
    color: 'brand-blue',
    title: 'FERPA & Data Privacy',
    summary: 'Student record confidentiality, FERPA obligations, and data handling.',
    content: [
      'All employees who access student records are subject to FERPA (Family Educational Rights and Privacy Act).',
      'Student records may not be shared with third parties without written consent from the student, except as permitted by law.',
      'Violations of FERPA can result in loss of federal funding and personal liability. Take this seriously.',
      'If you receive a request for student records from any external party, refer it to the FERPA Compliance Officer immediately.',
      'Data security: Use strong passwords, lock your screen when away from your desk, and never share login credentials.',
    ],
  },
];

export default async function EmployeeHandbookPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employee/handbook');

  // Check if user has already acknowledged
  const { data: ack } = await db
    .from('handbook_acknowledgments')
    .select('id, acknowledged_at')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employee', href: '/employee' }, { label: 'Handbook' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Employee Handbook</h1>
              <p className="text-slate-400 text-sm">Elevate for Humanity Career &amp; Technical Institute · {new Date().getFullYear()} Edition</p>
            </div>
          </div>
          <p className="text-slate-300 max-w-2xl">
            This handbook describes the policies, procedures, and expectations for all Elevate for Humanity employees.
            Please read each section carefully and acknowledge at the bottom.
          </p>
          {ack && (
            <div className="mt-4 inline-flex items-center gap-2 bg-brand-green-600/20 border border-brand-green-500/30 text-brand-green-300 px-4 py-2 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" />
              Acknowledged on {new Date(ack.acknowledged_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border mb-8">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-slate-900">Table of Contents</h2>
          </div>
          <div className="divide-y">
            {HANDBOOK_SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-white transition group">
                <span className="text-sm text-slate-400 w-6">{i + 1}</span>
                <s.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-500" />
                <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-brand-blue-700">{s.title}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-400" />
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {HANDBOOK_SECTIONS.map((section, i) => (
            <div key={section.id} id={section.id} className="bg-white rounded-xl border overflow-hidden scroll-mt-6">
              <div className="px-6 py-5 border-b bg-white flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-${section.color}-100 flex items-center justify-center`}>
                  <section.icon className={`w-5 h-5 text-${section.color}-600`} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Section {i + 1}</p>
                  <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-slate-500 text-sm mb-4 italic">{section.summary}</p>
                <ul className="space-y-3">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-400 mt-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Acknowledgment */}
        <div className="mt-10 bg-white rounded-xl border p-8 text-center">
          <BookOpen className="w-12 h-12 text-brand-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Acknowledge the Handbook</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            By acknowledging, you confirm that you have read, understood, and agree to comply with all policies in this handbook.
          </p>
          {ack ? (
            <div className="inline-flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 text-brand-green-700 px-6 py-3 rounded-xl font-semibold">
              <CheckCircle className="w-5 h-5" /> Already Acknowledged
            </div>
          ) : (
            <Link href="/employee/handbook/acknowledge"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-blue-700 transition">
              I Have Read and Understand This Handbook
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
