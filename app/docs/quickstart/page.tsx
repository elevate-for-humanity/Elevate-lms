export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Zap, ArrowLeft, ArrowRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
const steps = [
  { num: 1, title: 'Create Your Account', desc: 'Sign up and verify your email to get started.', link: '/register' },
  { num: 2, title: 'Complete Your Profile', desc: 'Add your organization details and contact information.', link: '/settings/profile' },
  { num: 3, title: 'Add Your Programs', desc: 'Set up your training programs with curriculum and schedules.', link: '/program-holder/programs' },
  { num: 4, title: 'Invite Your Team', desc: 'Add instructors and staff members to your organization.', link: '/settings/team' },
  { num: 5, title: 'Enroll Students', desc: 'Start enrolling students in your programs.', link: '/program-holder/students' },
  { num: 6, title: 'Track Progress', desc: 'Monitor student progress and generate reports.', link: '/program-holder/reports' },
];

export default async function QuickstartPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('documentation').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Quickstart" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <Link href="/docs" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Docs
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Zap className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quick Start Guide</h1>
            <p className="text-gray-600">Get up and running in minutes</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to Elevate!</h2>
          <p className="text-gray-600">Follow these steps to set up your training programs and start enrolling students. Most organizations complete setup in under 30 minutes.</p>
        </div>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-brand-blue-600 flex-shrink-0">
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
              <Link href={step.link} className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
                Start <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-brand-green-50 border border-brand-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h3 className="font-semibold text-brand-green-900">You are ready!</h3>
          </div>
          <p className="text-brand-green-800">Once you complete these steps, you will have a fully functional training program ready to accept students.</p>
        </div>
      </div>
    </div>
  );
}
