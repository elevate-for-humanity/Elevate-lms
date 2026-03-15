import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { FileText, Video, Download, ExternalLink } from 'lucide-react';

export const metadata: Metadata = { 
  title: 'Mentor Resources | Mentor Portal',
  description: 'Access training materials, guides, and tools to help you be an effective mentor.',
};

export default function MentorResourcesPage() {
  const resources = [
    { id: '1', title: 'Mentoring Best Practices Guide', type: 'pdf', category: 'Training', downloads: 234 },
    { id: '2', title: 'Effective Communication Workshop', type: 'video', category: 'Training', views: 567 },
    { id: '3', title: 'Goal Setting Templates', type: 'pdf', category: 'Tools', downloads: 189 },
    { id: '4', title: 'Session Planning Worksheet', type: 'pdf', category: 'Tools', downloads: 312 },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Mentor", href: "/mentor" }, { label: "Resources" }]} />
      </div>
<div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/mentor/dashboard" className="hover:text-brand-blue-600">Mentor Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Resources</span>
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentor Resources</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${resource.type === 'video' ? 'bg-brand-blue-100' : 'bg-brand-blue-100'}`}>
                  {resource.type === 'video' ? <Video className="w-6 h-6 text-brand-blue-600" /> : <FileText className="w-6 h-6 text-brand-blue-600" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{resource.category}</p>
                  <button className="flex items-center gap-1 text-brand-blue-600 hover:text-brand-blue-700 text-sm">
                    {resource.type === 'video' ? <>Watch <ExternalLink className="w-4 h-4" /></> : <>Download <Download className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
