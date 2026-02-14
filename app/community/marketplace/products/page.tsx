import { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Products | Elevate for Humanity',
  description:
    'Browse digital products, templates, and resources created by community members. Study guides, templates, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/marketplace/products',
  },
};

export default function CommunityProductsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Marketplace', href: '/community/marketplace' }, { label: 'Products' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Digital Products</h1>
          <p className="text-green-100">Templates, guides, and resources from the community</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 text-green-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Community Marketplace Coming Soon</h2>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          We are building a marketplace where students and instructors can share study guides,
          templates, and career resources. Check back soon.
        </p>
        <Link
          href="/community/marketplace"
          className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
