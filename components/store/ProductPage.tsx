'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Hook to track product page views
function useProductPageAnalytics(productId: string) {
  const supabase = createClient();
  const hasLogged = useRef(false);

  useEffect(() => {
    if (hasLogged.current) return;
    hasLogged.current = true;

    async function logPageView() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('product_page_views')
        .insert({
          product_id: productId,
          user_id: user?.id,
          viewed_at: new Date().toISOString()
        });
    }
    logPageView();
  }, [productId, supabase]);
}
import {
  Star,
  Play,
  ShoppingCart,
  Heart,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  MessageSquare,
  ThumbsUp,
  Shield,
  Clock,
  Download,
  RefreshCw,
  Users,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  HelpCircle,
  X,
  FileText,
  Building2,
  Bell,
  Search,
  DollarSign,
  Layout,
  Target,
  BarChart3,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  type LucideIcon
} from 'lucide-react';

// Icon map for serialization from server components
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Shield,
  Building2,
  Zap,
  Bell,
  Users,
  RefreshCw,
  Search,
  Clock,
  Check,
  DollarSign,
  Layout,
  Target,
  BarChart3,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  Monitor,
  Globe,
  Download,
  Star,
};

interface ProductImage {
  src: string;
  alt: string;
  type: 'image' | 'video';
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface PricingPlan {
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

interface Review {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ProductPageProps {
  product: {
    name: string;
    tagline: string;
    description: string;
    longDescription: string;
    category: string;
    rating: number;
    reviewCount: number;
    images: ProductImage[];
    features: Feature[];
    pricing: PricingPlan[];
    reviews: Review[];
    faqs: FAQ[];
    whatsIncluded: string[];
    requirements: string[];
    lastUpdated: string;
    version: string;
    developer: string;
    supportEmail: string;
  };
}

export function ProductPage({ product }: ProductPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const filteredReviews = reviewFilter === 'all' 
    ? product.reviews 
    : product.reviews.filter(r => r.rating === parseInt(reviewFilter));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/store" className="text-gray-500 hover:text-gray-700">Store</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href="/store/apps" className="text-gray-500 hover:text-gray-700">Apps</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
              {product.images[selectedImage]?.type === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <button 
                    onClick={() => setShowVideo(true)}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
                  >
                    <Play className="w-10 h-10 text-gray-900 ml-1" />
                  </button>
                </div>
              ) : (
                <Image
                  src={product.images[selectedImage]?.src || '/images/placeholder.jpg'}
                  alt={product.images[selectedImage]?.alt || product.name}
                  fill
                  className="object-cover"
                />
              )}
              
              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button 
                    onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${
                    selectedImage === i ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {img.type === 'video' ? (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <Image src={img.src} alt={img.alt} fill className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Category Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {product.category}
              </span>
              <span className="text-gray-500 text-sm">by {product.developer}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-xl text-blue-600 font-medium mb-4">{product.tagline}</p>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
                <span className="font-bold ml-1">{product.rating}</span>
              </div>
              <Link href="#reviews" className="text-blue-600 hover:underline">
                {product.reviewCount} reviews
              </Link>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {product.description}
            </p>

            {/* Quick Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {product.features.slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>{feature.title}</span>
                </div>
              ))}
            </div>

            {/* Pricing Selection */}
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Choose Your Plan</h3>
              <div className="space-y-3">
                {product.pricing.map((plan, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPlan(i)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition ${
                      selectedPlan === i 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === i ? 'border-blue-600' : 'border-gray-300'
                      }`}>
                        {selectedPlan === i && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">{plan.name}</p>
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl text-gray-900">${plan.price}</p>
                      {plan.originalPrice && (
                        <p className="text-sm text-gray-400 line-through">${plan.originalPrice}</p>
                      )}
                      <p className="text-xs text-gray-500">{plan.period}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6">
              <button className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition ${
                  isWishlisted ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
              <button className="w-14 h-14 rounded-xl border-2 border-gray-200 flex items-center justify-center hover:border-gray-300 transition">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>30-day money back</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="w-4 h-4" />
                <span>Free updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8 border-b overflow-x-auto">
            {['Overview', 'Features', 'Reviews', 'FAQ', 'Support'].map((tab, i) => (
              <a
                key={tab}
                href={`#${tab.toLowerCase()}`}
                className={`py-4 px-2 font-medium border-b-2 whitespace-nowrap ${
                  i === 0 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview */}
            <section id="overview">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Overview</h2>
              <div className="prose prose-lg max-w-none">
                <p>{product.longDescription}</p>
              </div>
            </section>

            {/* Features */}
            <section id="features">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {product.features.map((feature, i) => {
                  const IconComponent = iconMap[feature.icon] || Zap;
                  return (
                    <div key={i} className="bg-gray-50 rounded-xl p-6">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Reviews */}
            <section id="reviews">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                <select 
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value as any)}
                  className="border rounded-lg px-4 py-2"
                >
                  <option value="all">All Reviews</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Rating Summary */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-black text-gray-900">{product.rating}</p>
                    <div className="flex gap-1 justify-center my-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-5 h-5 ${i <= Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-gray-500">{product.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(stars => {
                      const count = product.reviews.filter(r => r.rating === stars).length;
                      const percent = (count / product.reviews.length) * 100;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm w-8">{stars}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-6">
                {filteredReviews.map(review => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        {review.avatar ? (
                          <Image src={review.avatar} alt={review.author} width={48} height={48} className="rounded-full" />
                        ) : (
                          <span className="font-bold text-gray-500">{review.author[0]}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{review.author}</span>
                          {review.verified && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Verified</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-gray-500 text-sm">{review.date}</span>
                        </div>
                        <h4 className="font-bold mb-2">{review.title}</h4>
                        <p className="text-gray-600">{review.content}</p>
                        <button className="flex items-center gap-2 mt-3 text-gray-500 hover:text-gray-700">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm">Helpful ({review.helpful})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {product.faqs.map((faq, i) => (
                  <div key={i} className="border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50"
                    >
                      <span className="font-bold">{faq.question}</span>
                      <ChevronDown className={`w-5 h-5 transition ${expandedFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4 text-gray-600">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* What's Included */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 mb-4">What&apos;s Included</h3>
              <ul className="space-y-3">
                {product.whatsIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {product.requirements.map((req, i) => (
                  <li key={i}>• {req}</li>
                ))}
              </ul>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Product Info</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Version</dt>
                  <dd className="font-medium">{product.version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="font-medium">{product.lastUpdated}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Developer</dt>
                  <dd className="font-medium">{product.developer}</dd>
                </div>
              </dl>
            </div>

            {/* Support */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">Our support team is here to help you get started.</p>
              <a 
                href={`mailto:${product.supportEmail}`}
                className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="aspect-video bg-black rounded-xl">
              {/* Video player would go here */}
              <div className="w-full h-full flex items-center justify-center text-white">
                Video Player
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
