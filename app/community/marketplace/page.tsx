import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  Star, 
  ShoppingBag, 
  Search,
  Filter,
  Tag,
  TrendingUp,
  Award,
  Package,
  Briefcase,
  Wrench,
  Heart,
  Scissors,
  Monitor,
  ChevronRight
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Community Marketplace | Elevate for Humanity',
  description: 'Discover courses, training materials, professional tools, and resources from our community of educators, program owners, and industry professionals.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/community/marketplace',
  },
};

export const dynamic = 'force-dynamic';

const MARKETPLACE_CATEGORIES = [
  { id: 'courses', name: 'Training Courses', icon: BookOpen, count: 0 },
  { id: 'tools', name: 'Professional Tools', icon: Wrench, count: 0 },
  { id: 'books', name: 'Books & Guides', icon: BookOpen, count: 0 },
  { id: 'templates', name: 'Templates', icon: Package, count: 0 },
  { id: 'equipment', name: 'Equipment', icon: Briefcase, count: 0 },
  { id: 'services', name: 'Services', icon: Users, count: 0 },
];

const FEATURED_CATEGORIES = [
  {
    id: 'healthcare',
    name: 'Healthcare Training',
    description: 'CNA study guides, medical terminology flashcards, clinical skills videos',
    icon: Heart,
    color: 'bg-brand-red-100 text-brand-red-600',
  },
  {
    id: 'trades',
    name: 'Skilled Trades',
    description: 'HVAC manuals, electrical code books, welding equipment, tool kits',
    icon: Wrench,
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
  {
    id: 'beauty',
    name: 'Beauty & Cosmetology',
    description: 'Barber kits, cosmetology supplies, state board prep materials',
    icon: Scissors,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'business',
    name: 'Business & Tax',
    description: 'Tax software, business templates, accounting guides, client forms',
    icon: Briefcase,
    color: 'bg-brand-green-100 text-brand-green-600',
  },
  {
    id: 'technology',
    name: 'Technology & IT',
    description: 'Certiport study guides, lab equipment, practice exams, software tools',
    icon: Monitor,
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
];

export default async function CommunityMarketplacePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  let courses: any[] = [];
  let products: any[] = [];
  let totalListings = 0;
  let totalSellers = 0;
  
  try {
    // Get creator courses
    const { data: courseData, count: courseCount } = await db
      .from('creator_courses')
      .select(`
        *,
        creator_profiles!inner(display_name, bio, verified)
      `, { count: 'exact' })
      .eq('published', true)
      .order('total_enrollments', { ascending: false })
      .limit(6);
    
    if (courseData) {
      courses = courseData;
    }

    // Get shop products
    const { data: productData, count: productCount } = await db
      .from('shop_products')
      .select(`
        *,
        shop_profiles!inner(shop_name, verified, rating)
      `, { count: 'exact' })
      .eq('status', 'active')
      .order('total_sales', { ascending: false })
      .limit(8);
    
    if (productData) {
      products = productData;
    }

    totalListings = (courseCount || 0) + (productCount || 0);

    // Count unique sellers
    const { count: sellerCount } = await db
      .from('shop_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    totalSellers = sellerCount || 0;
  } catch (error) {
    // Tables may not exist yet
    // Marketplace tables may not exist yet
  }

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Marketplace' }]} />
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-brand-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{totalListings.toLocaleString()} Products & Courses</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  Community Marketplace
                </h1>
                <p className="text-xl text-brand-green-100 mb-8 leading-relaxed">
                  Discover training courses, professional tools, study materials, and resources 
                  created by certified professionals, program owners, and industry experts in our community.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="#courses"
                    className="inline-flex items-center gap-2 bg-white text-brand-green-600 px-8 py-4 rounded-xl font-bold hover:bg-brand-green-50 transition shadow-lg"
                  >
                    <BookOpen className="w-5 h-5" />
                    Browse Courses
                  </Link>
                  <Link
                    href="#products"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition border border-white/30"
                  >
                    <Package className="w-5 h-5" />
                    Shop Products
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
                  <h3 className="text-xl font-bold mb-6">Marketplace Stats</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white/10 rounded-xl">
                      <div className="text-4xl font-black">{totalListings}</div>
                      <div className="text-brand-green-200 text-sm mt-1">Total Listings</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl">
                      <div className="text-4xl font-black">{totalSellers}</div>
                      <div className="text-brand-green-200 text-sm mt-1">Verified Sellers</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl">
                      <div className="text-4xl font-black">5</div>
                      <div className="text-brand-green-200 text-sm mt-1">Categories</div>
                    </div>
                    <div className="text-center p-4 bg-white/10 rounded-xl">
                      <div className="text-4xl font-black">4.8</div>
                      <div className="text-brand-green-200 text-sm mt-1">Avg Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses, products, tools..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <select className="px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                  <option value="">All Categories</option>
                  {MARKETPLACE_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-white">
                  <Filter className="w-5 h-5" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Shop by Industry</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {FEATURED_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link
                    key={category.id}
                    href={`/community/marketplace/category/${category.id}`}
                    className="group bg-white rounded-xl p-5 hover:bg-white transition"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${category.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-green-600 transition">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section id="courses" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Featured Courses</h2>
                <p className="text-slate-600 mt-2">Learn from certified professionals and industry experts</p>
              </div>
              <Link 
                href="/community/marketplace/courses" 
                className="text-brand-green-600 font-bold hover:text-brand-green-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/community/courses/${course.id}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="aspect-video bg-white overflow-hidden relative">
                      {course.thumbnail_url ? (
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-brand-green-100 text-brand-green-700 text-xs font-semibold rounded-full">
                          {course.category || 'Course'}
                        </span>
                        {course.creator_profiles?.verified && (
                          <span className="text-brand-blue-600 text-xs font-medium">• Verified</span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-green-600 transition line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{course.total_enrollments || 0}</span>
                          </div>
                          {course.average_rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xl font-bold">
                          {course.is_free ? (
                            <span className="text-brand-green-600">Free</span>
                          ) : (
                            <span className="text-slate-900">${(course.price / 100).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-600">
                          by <span className="font-semibold text-slate-900">{course.creator_profiles?.display_name}</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Courses Yet</h3>
                <p className="text-slate-600 mb-6">Be the first to create and sell a course in our marketplace!</p>
                <Link
                  href="/creator/dashboard"
                  className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-700 transition"
                >
                  Start Creating
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Shop Products */}
        <section id="products"className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Shop Products</h2>
                <p className="text-slate-600 mt-2">Tools, equipment, and resources from community sellers</p>
              </div>
              <Link 
                href="/community/marketplace/products" 
                className="text-brand-green-600 font-bold hover:text-brand-green-700 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <Link
                    key={product.id}
                    href={`/community/shop/products/${product.id}`}
                    className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="aspect-square bg-white overflow-hidden relative">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-2 group-hover:text-brand-green-600 transition line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-slate-900">
                          ${(product.price / 100).toFixed(2)}
                        </div>
                        {product.compare_at_price && (
                          <div className="text-sm text-slate-500 line-through">
                            ${(product.compare_at_price / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{product.shop_profiles?.shop_name}</span>
                          {product.shop_profiles?.verified && (
                            <span className="text-brand-blue-600 font-medium">• Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-16 text-center">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Products Yet</h3>
                <p className="text-slate-600 mb-6">Start selling your products and tools to the community!</p>
                <Link
                  href="/shop/seller/register"
                  className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-green-700 transition"
                >
                  Become a Seller
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Become a Seller CTA */}
        <section className="py-20 bg-brand-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-brand-green-400 text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Join {totalSellers}+ Sellers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Turn Your Expertise Into Income
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Are you a certified professional, program owner, or industry expert? 
              Create courses, sell products, and build your brand in our marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/creator/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-brand-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-green-700 transition"
              >
                <BookOpen className="w-5 h-5" />
                Create a Course
              </Link>
              <Link
                href="/shop/seller/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-white transition"
              >
                <ShoppingBag className="w-5 h-5" />
                Open a Shop
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-brand-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-brand-green-600" />
                </div>
                <h3 className="font-bold text-slate-900">Verified Sellers</h3>
                <p className="text-sm text-slate-600 mt-1">All sellers are vetted and verified</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Tag className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Best Prices</h3>
                <p className="text-sm text-slate-600 mt-1">Competitive pricing from the community</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Quality Guaranteed</h3>
                <p className="text-sm text-slate-600 mt-1">Ratings and reviews from real buyers</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-brand-orange-600" />
                </div>
                <h3 className="font-bold text-slate-900">Community Support</h3>
                <p className="text-sm text-slate-600 mt-1">Help from fellow professionals</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
