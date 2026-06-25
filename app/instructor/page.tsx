import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate For Humanity',
  description: 'Instructor resources and management portal.',
};

export default function InstructorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Instructor Portal</h1>
        <div className="grid gap-6">
          <Link href="/instructor/instructors" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Instructors</h2>
            <p className="text-slate-600">View instructor directory</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
