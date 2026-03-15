export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Shield, FileText, DollarSign, Users, Download,
  AlertCircle, Clock, ArrowRight, BarChart,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance & Reporting | Employer Portal | Elevate for Humanity',
  description: 'Employer compliance tools, WIOA reporting, WOTC tax credits, and EEO documentation.',
};

const complianceAreas = [
  {
    icon: BarChart,
    title: 'WIOA Reporting',
    description: 'Track workforce outcomes, participant progress, and submit required quarterly and annual reports to meet DOL requirements.',
    status: 'Active',
    actions: [
      { label: 'View Reports', href: '/employer/reports' },
      { label: 'Submit Data', href: '/employer/reports/submit' },
    ],
  },
  {
    icon: DollarSign,
    title: 'Tax Credits (WOTC)',
    description: 'Access Work Opportunity Tax Credits for hiring from eligible populations. Credits range from $2,400 to $9,600 per qualified hire.',
    status: 'Active',
    actions: [
      { label: 'View Eligible Hires', href: '/employer-portal/wotc' },
      { label: 'Download Forms', href: '/employer/documents' },
    ],
  },
  {
    icon: Users,
    title: 'Equal Opportunity',
    description: 'EEO compliance documentation, non-discrimination policies, and required postings for your workplace.',
    status: 'Active',
    actions: [
      { label: 'View Policy', href: '/equal-opportunity' },
      { label: 'Download Poster', href: '/employer/documents' },
    ],
  },
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Required forms, agreements, and records for workforce program participation. Keep your files current and audit-ready.',
    status: 'Active',
    actions: [
      { label: 'View Documents', href: '/employer/documents' },
      { label: 'Upload Files', href: '/employer/documents/upload' },
    ],
  },
];

const upcomingDeadlines = [
  { title: 'Q1 WIOA Performance Report', date: 'March 31, 2026', priority: 'high' },
  { title: 'Annual EEO-1 Report', date: 'March 31, 2026', priority: 'high' },
  { title: 'WOTC Certification Renewal', date: 'April 15, 2026', priority: 'medium' },
  { title: 'Apprenticeship Progress Report', date: 'April 30, 2026', priority: 'medium' },
];

const quickChecklist = [
  'Signed employer agreement on file',
  'WOTC pre-screening forms completed for new hires',
  'EEO poster displayed in workplace',
  'Apprentice training logs up to date',
  'Insurance and workers comp documentation current',
  'Background check policy on file',
];

export default async function EmployerCompliancePage() {
  let user = null;
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      user = authData.user;
    }
  } catch {
    // Auth unavailable — continue as unauthenticated
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Employer', href: '/employer' }, { label: 'Compliance' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-slate-300" />
            <div>
              <h1 className="text-3xl font-bold">Compliance & Reporting</h1>
              <p className="text-slate-300">Stay compliant with workforce development requirements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Compliance Areas */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {complianceAreas.map((area, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <area.icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{area.title}</h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-brand-green-100 text-brand-green-700 rounded-full">{area.status}</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{area.description}</p>
              <div className="flex flex-wrap gap-2">
                {area.actions.map((action, j) => (
                  <Link key={j} href={action.href} className="text-sm px-4 py-2 bg-white rounded-lg hover:bg-brand-blue-50 hover:text-brand-blue-600 transition font-medium">
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-orange-600" /> Upcoming Deadlines
            </h2>
            <div className="space-y-3">
              {upcomingDeadlines.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className={`w-4 h-4 ${item.priority === 'high' ? 'text-brand-red-500' : 'text-yellow-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Checklist */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span> Compliance Checklist
            </h2>
            <div className="space-y-3">
              {quickChecklist.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-200">
          <h2 className="font-bold text-gray-900 mb-2">Need Compliance Help?</h2>
          <p className="text-gray-600 text-sm mb-4">Our compliance team can help you understand requirements and prepare documentation.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="text-sm px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium">
              Contact Compliance Team
            </Link>
            <Link href="/store/compliance" className="text-sm px-4 py-2 bg-white border rounded-lg hover:bg-white transition font-medium">
              View Compliance Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
