import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Schools | Elevate For Humanity',
  description: 'Partner schools and educational institutions.',
};

export default function SchoolsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Our Schools</h1>
        <div className="grid gap-6">
          <Link href="/schools/mesmerized-by-beauty" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-2xl font-semibold">Mesmerized by Beauty</h2>
            <p className="text-slate-600">Partner school location</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
