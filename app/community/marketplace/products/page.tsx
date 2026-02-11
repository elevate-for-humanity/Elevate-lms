import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Download,
  Star,
  Search,
  ShoppingCart,
  Tag,
} from 'lucide-react';
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
  const products = [
    {
      id: '1',
      title: 'HVAC Certification Study Flashcards',
      creator: 'Student',
      rating: 4.9,
      reviews: 87,
      downloads: 234,
      price: '$9.99',
      type: 'Digital Download',
      category: 'Study Materials',
    },
    {
      id: '2',
      title: 'Medical Assistant Resume Template Pack',
      creator: 'Career Services',
      rating: 4.8,
      reviews: 156,
      downloads: 567,
      price: 'Free',
      type: 'Template',
      category: 'Career Tools',
    },
    {
      id: '3',
      title: 'Barber Client Consultation Forms',
      creator: 'James Williams',
      rating: 4.7,
      reviews: 45,
      downloads: 189,
      price: '$4.99',
      type: 'Template',
      category: 'Business Tools',
    },
    {
      id: '4',
      title: 'Interview Preparation Workbook',
      creator: 'Angela Roberts',
      rating: 4.9,
      reviews: 234,
      downloads: 890,
      price: 'Free',
      type: 'Workbook',
      category: 'Career Tools',
    },
    {
      id: '5',
      title: 'Electrical Code Quick Reference Guide',
      creator: 'Mike Thompson',
      rating: 4.6,
      reviews: 67,
      downloads: 345,
      price: '$14.99',
      type: 'Digital Download',
      category: 'Study Materials',
    },
    {
      id: '6',
      title: 'Healthcare Terminology Cheat Sheet',
      creator: 'Instructor',
      rating: 4.8,
      reviews: 123,
      downloads: 456,
      price: '$2.99',
      type: 'Digital Download',
      category: 'Study Materials',
    },
  ];

  const categories = [
    'All Products',
    'Study Materials',
    'Career Tools',
    'Business Tools',
    'Templates',
    'Workbooks',
  ];

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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    index === 0
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded ${
                    product.price === 'Free' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {product.price}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-3">by {product.creator}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {product.type}
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    {product.rating} ({product.reviews})
                  </span>
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {product.downloads}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/community/marketplace/products/${product.id}`}
                    className="flex-1 text-center py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                  >
                    Preview
                  </Link>
                  <button className="flex-1 flex items-center justify-center py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.price === 'Free' ? 'Get Free' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
            Load More Products
          </button>
        </div>

        {/* Sell Products CTA */}
        <div className="mt-12 bg-green-600 rounded-xl p-8 text-white text-center">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Sell Your Products</h2>
          <p className="text-green-100 mb-6 max-w-xl mx-auto">
            Create and sell digital products to help others succeed. Templates, guides, workbooks, and more.
          </p>
          <Link
            href="/creator/products/new"
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition inline-block"
          >
            Start Selling
          </Link>
        </div>
      </div>
    </div>
  );
}
