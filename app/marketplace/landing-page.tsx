import Link from 'next/link';
import {
  ShoppingBag, Store, CreditCard, TrendingUp, Shield,
  Users, Zap, Award, ArrowRight, Star
} from 'lucide-react';

export const metadata = {
  title: 'Marketplace - Buy & Sell Services | Elevate Hub',
  description: 'Connect with service providers, buy products, and grow your business in our trusted marketplace',
};

export default function MarketplaceLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <ShoppingBag className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Marketplace</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Services, products, and business solutions in one place.
            Connect with trusted providers and grow your business.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/marketplace/browse"
              className="px-8 py-4 bg-white text-brand-blue-600 rounded-lg font-bold hover:bg-white flex items-center gap-2"
            >
              Browse Marketplace
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marketplace/sell"
              className="px-8 py-4 bg-brand-blue-700 text-white rounded-lg font-bold hover:bg-brand-blue-800 border-2 border-white"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Marketplace Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Store className="w-12 h-12 text-brand-blue-600" />}
              title="Shop"
              description="Browse thousands of products and services from verified sellers"
              href="/shop"
            />
            <FeatureCard
              icon={<ShoppingBag className="w-12 h-12 text-brand-blue-600" />}
              title="Store"
              description="Set up your own store and reach thousands of buyers"
              href="/store"
            />
            <FeatureCard
              icon={<CreditCard className="w-12 h-12 text-brand-green-600" />}
              title="Secure Payments"
              description="Safe and secure payment processing with buyer protection"
              href="/store"
            />
            <FeatureCard
              icon={<TrendingUp className="w-12 h-12 text-brand-orange-600" />}
              title="Banking Services"
              description="Business banking and financial services for sellers"
              href="/banking"
            />
            <FeatureCard
              icon={<Shield className="w-12 h-12 text-brand-red-600" />}
              title="Buyer Protection"
              description="100% money-back guarantee on all purchases"
              href="/marketplace/protection"
            />
            <FeatureCard
              icon={<Users className="w-12 h-12 text-indigo-600" />}
              title="Verified Sellers"
              description="All sellers are verified and rated by the community"
              href="/marketplace/sellers"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Categories</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <CategoryCard title="Training Services" count="150+ services" />
            <CategoryCard title="Consulting" count="200+ consultants" />
            <CategoryCard title="Digital Products" count="500+ products" />
            <CategoryCard title="Professional Services" count="300+ providers" />
            <CategoryCard title="Equipment & Tools" count="1000+ items" />
            <CategoryCard title="Software & Apps" count="250+ solutions" />
            <CategoryCard title="Marketing Services" count="180+ services" />
            <CategoryCard title="Business Services" count="400+ services" />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Marketplace?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <BenefitCard
              icon={<Zap className="w-8 h-8 text-yellow-500" />}
              title="Fast & Easy"
              description="List products in minutes, start selling immediately"
            />
            <BenefitCard
              icon={<Shield className="w-8 h-8 text-brand-green-500" />}
              title="Secure Transactions"
              description="Bank-level security for all payments and data"
            />
            <BenefitCard
              icon={<Award className="w-8 h-8 text-brand-blue-500" />}
              title="Quality Guaranteed"
              description="All sellers verified, all products reviewed"
            />
            <BenefitCard
              icon={<Users className="w-8 h-8 text-brand-blue-500" />}
              title="Large Community"
              description="Connect with thousands of buyers and sellers"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-brand-blue-600 to-brand-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="10,000+" label="Active Users" />
            <StatCard number="5,000+" label="Products Listed" />
            <StatCard number="$2M+" label="Total Sales" />
            <StatCard number="4.8/5" label="Average Rating" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-black mb-8">
            Browse and purchase workforce tools and resources
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/marketplace/browse"
              className="px-8 py-4 bg-brand-blue-600 text-white rounded-lg font-bold hover:bg-brand-blue-700"
            >
              Start Shopping
            </Link>
            <Link
              href="/marketplace/sell"
              className="px-8 py-4 bg-gray-200 text-black rounded-lg font-bold hover:bg-gray-300"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }: any) {
  return (
    <Link href={href} className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-black">{description}</p>
    </Link>
  );
}

function CategoryCard({ title, count }: any) {
  return (
    <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow bg-white cursor-pointer">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-black">{count}</p>
    </div>
  );
}

function BenefitCard({ icon, title, description }: any) {
  return (
    <div className="flex gap-4 p-6 border rounded-lg bg-white">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-black">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ number, label }: any) {
  return (
    <div>
      <div className="text-4xl font-bold mb-2">{number}</div>
      <div className="text-lg">{label}</div>
    </div>
  );
}
