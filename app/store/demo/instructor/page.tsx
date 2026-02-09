import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Demo | Elevate LMS Platform',
  description: 'Explore the instructor experience in the Elevate LMS platform.',
};

const DEMO_SECTIONS = [
  { title: 'Course Builder', description: 'Create and organize course content, lessons, and modules.', demoUrl: '/instructor/courses' },
  { title: 'Assessment Tools', description: 'Build quizzes, assignments, and practical assessments.', demoUrl: '/instructor/assessments' },
  { title: 'Gradebook', description: 'Track student progress, grades, and completion status.', demoUrl: '/instructor/gradebook' },
  { title: 'Certificate Templates', description: 'Design and issue certificates upon course completion.', demoUrl: '/instructor/certificates' },
  { title: 'Student Communication', description: 'Send announcements and messages to enrolled students.', demoUrl: '/instructor/messages' },
];

export default function InstructorDemoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Instructor" }]} />
      </div>
<section className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/store/demo" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Demo Center
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Instructor Demo</h1>
              <p className="text-blue-200">Explore the instructor experience</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {DEMO_SECTIONS.map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{section.title}</h2>
                <p className="text-slate-600">{section.description}</p>
              </div>
              <Link href={section.demoUrl} target="_blank" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                Open <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800 text-sm"><strong>Note:</strong> This demo uses sample data. Some features require authentication. Full access available after platform setup.</p>
          </div>
        </div>
      </section>
      <section className="py-12 px-4 bg-white border-t text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to set up your platform?</h2>
        <Link href="/store/licenses/managed" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
          Start License Setup <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
