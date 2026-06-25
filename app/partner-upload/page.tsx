import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Partner Upload | Elevate For Humanity',
  description: 'Upload partner documents and data.',
};

export default function PartnerUploadPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Partner Upload</h1>
        <p className="text-slate-600">Upload partner documents securely.</p>
      </div>
    </div>
  );
}
