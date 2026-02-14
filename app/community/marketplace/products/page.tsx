import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText, BookOpen, Download, Star, Tag,
  Briefcase, GraduationCap, Wrench, Heart, ChevronRight,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Digital Products & Resources | Elevate for Humanity',
  description:
    'Study guides, resume templates, career toolkits, and professional resources for workforce development students and graduates.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/marketplace/products',
  },
};

const products = [
  {
    title: 'CNA Exam Study Guide',
    category: 'Healthcare',
    description: 'Practice questions, skills checklists, and test-taking strategies for the Indiana CNA certification exam.',
    icon: Heart,
    price: 'Free',
    downloads: '2,400+',
    rating: 4.9,
  },
  {
    title: 'CDL Pre-Trip Inspection Checklist',
    category: 'Skilled Trades',
    description: 'Step-by-step pre-trip inspection guide covering all CDL Class A and Class B test components.',
    icon: Wrench,
    price: 'Free',
    downloads: '1,800+',
    rating: 4.8,
  },
  {
    title: 'Professional Resume Template Pack',
    category: 'Career Services',
    description: 'Five industry-specific resume templates designed for healthcare, trades, technology, and business careers.',
    icon: FileText,
    price: 'Free',
    downloads: '3,100+',
    rating: 4.7,
  },
  {
    title: 'WIOA Funding Application Guide',
    category: 'Funding',
    description: 'Step-by-step walkthrough for completing your WIOA application through Indiana Career Connect.',
    icon: BookOpen,
    price: 'Free',
    downloads: '1,500+',
    rating: 4.9,
  },
  {
    title: 'Interview Preparation Toolkit',
    category: 'Career Services',
    description: 'Common interview questions, STAR method worksheets, and employer research templates.',
    icon: Briefcase,
    price: 'Free',
    downloads: '2,200+',
    rating: 4.8,
  },
  {
    title: 'Barber Apprenticeship Hour Log',
    category: 'Barber',
    description: 'Printable and digital hour tracking sheets for Indiana barber apprenticeship requirements.',
    icon: GraduationCap,
    price: 'Free',
    downloads: '900+',
    rating: 4.6,
  },
];

const categories = [
  { name: 'All Resources', count: products.length, active: true },
  { name: 'Healthcare', count: 1 },
  { name: 'Skilled Trades', count: 1 },
  { name: 'Career Services', count: 2 },
  { name: 'Funding', count: 1 },
  { name: 'Barber', count: 1 },
];

export default function CommunityProductsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Community', href: '/community' },
              { label: 'Marketplace', href: '/community/marketplace' },
              { label: 'Resources' },
            ]}
          />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Digital Resources
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Free study guides, templates, and career tools created for Elevate students and graduates.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="lg:grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sidebar Categories */}
          <aside className="mb-8 lg:mb-0">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Categories
            </h2>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <span
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      cat.active
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.name}
                    <span
                      className={`text-xs ${
                        cat.active ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Product Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600 text-sm">
                {products.length} resources available
              </p>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Tag className="w-4 h-4" />
                All free for Elevate students
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.title}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <product.icon className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                        {product.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        {product.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {product.downloads}
                      </span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {product.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="bg-slate-50 border-t py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Need Help Finding Resources?
          </h2>
          <p className="text-slate-600 mb-6">
            Contact our career services team for personalized guidance on study materials and career tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/career-services"
              className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Career Services
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/community/marketplace"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50 transition"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
