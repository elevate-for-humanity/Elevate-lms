
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, ArrowLeft, Users, FileText, Settings, BarChart3 } from 'lucide-react';

const sections = [
  { icon: Users, title: 'Managing Students', items: ['Add new students', 'Track enrollment status', 'Monitor progress', 'Generate reports'] },
  { icon: FileText, title: 'Program Administration', items: ['Update program details', 'Manage curriculum', 'Set schedules', 'Configure prerequisites'] },
  { icon: BarChart3, title: 'Reporting & Compliance', items: ['WIOA performance reports', 'Attendance tracking', 'Outcome documentation', 'Audit preparation'] },
  { icon: Settings, title: 'Settings & Configuration', items: ['Branding customization', 'User permissions', 'Notification preferences', 'Integration setup'] },
];

export default function ProgramHolderGuidePage() {

  return (
    <div className="min-h-screen bg-white py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Program Holder Guide" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Docs
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-brand-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Holder Guide</h1>
            <p className="text-gray-600">Complete guide to managing your training programs</p>
          </div>
        </div>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-brand-blue-900 mb-2">Getting Started</h2>
          <p className="text-brand-blue-800 mb-4">Welcome to the Elevate Program Holder Portal. This guide will help you manage your training programs effectively.</p>
          <div className="flex gap-4">
            <Link href="/program-holder" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">Go to Portal</Link>
            <Link href="/docs/quickstart" className="px-4 py-2 border border-brand-blue-600 text-brand-blue-600 rounded-lg hover:bg-brand-blue-50">Quick Start</Link>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-600">
                    <span className="text-slate-500 flex-shrink-0">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-4">Our support team is available to assist you with any questions.</p>
          <div className="flex gap-4">
            <Link href="/contact" className="px-4 py-2 bg-white rounded-lg hover:bg-gray-200">Contact Support</Link>
            <Link href="/docs" className="px-4 py-2 bg-white rounded-lg hover:bg-gray-200">Browse All Docs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
