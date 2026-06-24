import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Course Preview | Elevate For Humanity',
  description: 'Preview our career training courses and find the right program for your goals.',
};

export default function CoursePreviewPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Course Previews</h1>
        <div className="grid gap-6">
          <Link href="/course-preview/hvac-technician" className="block p-6 border rounded-xl hover:border-brand-blue-500 hover:shadow-md">
            <h2 className="text-2xl font-semibold mb-2">HVAC Technician</h2>
            <p className="text-slate-600">Preview our HVAC technician training program</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
