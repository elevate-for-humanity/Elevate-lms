import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'HVAC Module 1 | Elevate For Humanity',
  description: 'HVAC technician training module 1.',
};

export default function Module1Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">HVAC Module 1</h1>
        <div className="grid gap-6">
          <Link href="/courses-hvac/module1/lesson1" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-2xl font-semibold">Lesson 1</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
