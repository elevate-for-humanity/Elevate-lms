import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MOU | Elevate For Humanity',
  description: 'Memorandum of Understanding documents.',
};

export default function MouPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Memorandum of Understanding</h1>
        <Link href="/mou/employer" className="block p-6 border rounded-xl hover:border-brand-blue-500">
          <h2 className="text-xl font-semibold">Employer MOU</h2>
          <p className="text-slate-600">Employer partnership agreement template</p>
        </Link>
      </div>
    </div>
  );
}
