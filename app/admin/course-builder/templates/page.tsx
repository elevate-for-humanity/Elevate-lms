
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, Copy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Templates | Admin | Elevate For Humanity',
  description: 'Pre-built course templates to get started quickly.',
};

const templates = [
  {
    id: 'healthcare-cert',
    name: 'Healthcare Certification',
    description: 'Template for healthcare certification programs like CNA, Phlebotomy',
    modules: 8,
    category: 'Healthcare',
  },
  {
    id: 'skilled-trades',
    name: 'Skilled Trades',
    description: 'Template for trade programs like HVAC, Electrical, Plumbing',
    modules: 12,
    category: 'Trades',
  },
  {
    id: 'it-certification',
    name: 'IT Certification',
    description: 'Template for technology certifications and IT training',
    modules: 10,
    category: 'Technology',
  },
  {
    id: 'soft-skills',
    name: 'Soft Skills',
    description: 'Template for professional development and soft skills training',
    modules: 6,
    category: 'Professional',
  },
];

export default async function CourseTemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/admin/course-builder/templates');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/admin/course-builder"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Course Builder
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Course Templates</h1>
          <p className="text-gray-600 mt-1">Start with a pre-built template to save time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-brand-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{template.description}</p>
              <p className="text-sm text-gray-500 mb-4">{template.modules} modules included</p>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors">
                <Copy className="w-4 h-4" />
                Use Template
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Create Custom Template</h3>
              <p className="text-sm text-gray-600">Build your own reusable course template</p>
            </div>
            <Link
              href="/admin/course-builder"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start from Scratch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
