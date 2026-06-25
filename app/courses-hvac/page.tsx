import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'HVAC Technician Training | Elevate For Humanity',
  description: 'Complete HVAC technician training program with hands-on instruction.',
};

export default function CoursesHvacPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">HVAC Technician Training</h1>
        <Link href="/courses-hvac/module1" className="block p-6 border rounded-xl hover:border-brand-blue-500">
          <h2 className="text-2xl font-semibold">Module 1</h2>
          <p className="text-slate-600">Get started with HVAC fundamentals</p>
        </Link>
      </div>
    </div>
  );
}
