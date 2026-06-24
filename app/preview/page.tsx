import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Preview | Elevate For Humanity',
  description: 'Preview content and features.',
};

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Preview</h1>
        <div className="grid gap-6">
          <Link href="/preview/barber-studio" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Barber Studio Preview</h2>
          </Link>
          <Link href="/preview/barber-videos" className="block p-6 border rounded-xl hover:border-brand-blue-500">
            <h2 className="text-xl font-semibold">Barber Videos Preview</h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
