import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclosures | Elevate For Humanity',
  description: 'Training delivery and institutional disclosures.',
};

export default function DisclosuresPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Disclosures</h1>
        <Link href="/disclosures/training-delivery" className="block p-6 border rounded-xl hover:border-brand-blue-500">
          <h2 className="text-xl font-semibold">Training Delivery</h2>
        </Link>
      </div>
    </div>
  );
}
