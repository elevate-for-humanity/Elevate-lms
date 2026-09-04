import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, CheckCircle, ArrowRight, TrendingUp, Award, Target } from 'lucide-react';
import { SimpleAddToCartButton } from '@/components/store/SimpleAddToCartButton';
import { getProducts, type Product } from '@/lib/store/db';

export const metadata: Metadata = {
  title: 'Certification Practice Tests & Exam Prep',
  description:
    'Shop certification practice tests and exam-prep materials for Microsoft Office, ACT WorkKeys, EPA 608, OSHA 10, CNA, and other workforce credentials.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/practice-tests',
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Certification Practice Tests & Exam Prep | Elevate Store',
    description: 'Practice tests and exam-prep products for workforce and industry credentials.',
    url: 'https://www.elevateforhumanity.org/store/practice-tests',
    type: 'website',
  },
};

const benefits = [
  {
    icon: Target,
    title: 'Real Exam Format',
    desc: 'Questions mirror the actual certification exam structure and difficulty',
  },
  {
    icon: TrendingUp,
    title: 'Score Tracking',
    desc: 'Track your progress and identify weak areas before test day',
  },
  {
    icon: Clock,
    title: 'Timed Practice',
    desc: 'Simulate real exam conditions with time-limited practice sessions',
  },
  {
    icon: CheckCircle,
    title: 'Detailed Explanations',
    desc: "Every answer includes a thorough explanation of why it's correct",
  },
];

function isPracticeTestProduct(product: Product) {
  const tags = (product.tags || []).map((tag) => String(tag).toLowerCase());
  const category = String(product.category || '').toLowerCase();
  const type = String(product.type || '').toLowerCase();
  return (
    tags.includes('practice-test') ||
    tags.includes('exam-prep') ||
    category.includes('test') ||
    type === 'practice_test'
  );
}

export default async function PracticeTestsPage() {
  const products = (await getProducts({ limit: 200 })).filter(isPracticeTestProduct);
  const productListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Elevate certification practice tests',
    url: 'https://www.elevateforhumanity.org/store/practice-tests',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description,
        sku: product.slug,
        brand: { '@type': 'Brand', name: 'Elevate for Humanity' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: product.price,
          availability: 'https://schema.org/InStock',
          url: 'https://www.elevateforhumanity.org/store/practice-tests',
        },
      },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Practice Tests' }]} />
      </div>

      {/* Hero - Bright & Clean */}
      <section className="relative h-[clamp(420px,58vh,720px)] flex items-end overflow-hidden bg-slate-100">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/instructors/lisa-martinez.webp"
            alt="Practice Tests"
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
        </div>

        {/* White Content Box */}
        <div className="relative z-10 w-full bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
                <BookOpen className="w-4 h-4" />
                Practice Tests & Exam Prep
              </span>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
                Pass Your Exam <span className="text-brand-red-600">The First Time</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                Certification-focused practice questions, detailed explanations, and performance
                tracking to help you prepare before test day.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-slate-600">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-red-600" />
                  <span>Certification-focused preparation</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-red-600" />
                  <span>
                    {products.length
                      ? `${products.length} verified options`
                      : 'Catalog verified before sale'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-red-600" />
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Practice Tests Work</h2>
            <p className="text-lg text-slate-600">
              Research shows that practice testing is one of the most effective study methods
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bg-white rounded-xl p-6 border border-slate-200 text-center"
                >
                  <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-yellow-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-sm">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Individual Practice Tests */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-red-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Individual Practice Tests</h2>
              <p className="text-slate-600">One exam at a time, instant access</p>
            </div>
          </div>

          {products.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-brand-red-200 transition-all"
                >
                  <span className="text-xs font-semibold uppercase text-slate-500">
                    {product.category}
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900">{product.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{product.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xl font-bold text-slate-900">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <SimpleAddToCartButton
                      productId={product.id}
                      productName={product.name}
                      price={Number(product.price)}
                      className="px-3 py-1.5 bg-brand-red-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <h3 className="text-xl font-bold text-slate-900">
                Practice tests are being verified
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-slate-700">
                No practice-test product is currently approved for sale. Products appear here only
                after their database record, price, checkout, and learner access have been verified.
              </p>
              <Link
                href="/testing"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                View available testing services
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to boost your confidence?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Start practicing today and walk into your exam with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/testing"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all"
            >
              View All Exams
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-all"
            >
              Browse Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
