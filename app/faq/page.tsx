import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page | Elevate for Humanity',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Page</h1>
        <p className="text-gray-600">Coming soon.</p>
      </div>
    </div>
  );
}
