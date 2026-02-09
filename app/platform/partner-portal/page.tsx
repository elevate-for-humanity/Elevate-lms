import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Users, BarChart, FileText, Settings, CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Portal | Elevate For Humanity',
  description: 'Manage students, track outcomes, and access reports through the partner portal.',
};

const features = [
  { icon: Users, title: 'Student Management', description: 'Enroll and track student progress' },
  { icon: BarChart, title: 'Analytics Dashboard', description: 'Real-time performance metrics' },
  { icon: FileText, title: 'Reporting', description: 'Generate compliance and outcome reports' },
  { icon: Settings, title: 'Program Settings', description: 'Configure your programs and courses' },
];

export default function PartnerPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform' }, { label: 'Partner Portal' }]} />
        </div>
      </div>

      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Partner Portal</h1>
          <p className="text-xl text-blue-100 mb-8">Everything you need to manage your training programs</p>
          <Link href="/partners/login" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-50">
            Access Portal <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border flex items-start gap-4">
                <f.icon className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Become a Partner</h2>
          <p className="text-gray-600 mb-8">Join our network of training providers and community organizations.</p>
          <Link href="/partners/join" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700">
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
