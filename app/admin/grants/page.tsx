import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grants | Admin',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Grants</h1>
        <p className="text-gray-600">Admin page under construction.</p>
      </div>
    </div>
  );
}
