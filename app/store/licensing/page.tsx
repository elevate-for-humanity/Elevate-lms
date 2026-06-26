import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Licensing | Elevate Store',
  description: 'Software licensing management.',
};

export default function StoreLicensingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Licensing</h1>
        <div className="grid gap-6">
          <Link href="/store/licensing/checkout" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Checkout</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
