'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  Play, 
  Clock, 
  ShoppingCart,
  Star,
} from 'lucide-react';

interface CourseFeature {
  feature: string;
  sort_order: number;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  original_price: number;
  image_url: string;
  duration_hours: number;
  lesson_count: number;
  is_bestseller: boolean;
  is_bundle: boolean;
  features: CourseFeature[];
}

interface CareerCoursesClientProps {
  courses: Course[];
  bundle: Course | null | undefined;
}

export function CareerCoursesClient({ courses, bundle }: CareerCoursesClientProps) {
  const [cart, setCart] = useState<string[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  const addToCart = (courseId: string) => {
    if (!cart.includes(courseId)) {
      setCart([...cart, courseId]);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);

    try {
      const response = await fetch('/api/checkout/career-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: cart,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  const getCartTotal = () => {
    let total = 0;
    cart.forEach(id => {
      if (bundle && id === bundle.id) {
        total += Number(bundle.price);
      } else {
        const course = courses.find(c => c.id === id);
        if (course) total += Number(course.price);
      }
    });
    return total;
  };

  const sortedFeatures = (features: CourseFeature[]) => {
    return [...features].sort((a, b) => a.sort_order - b.sort_order);
  };

  return (
    <>
      {/* Cart Summary (if items) */}
      {cart.length > 0 && (
        <div className="bg-green-600 text-white py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span>{cart.length} item(s) in cart</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">${getCartTotal().toFixed(2)}</span>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 disabled:opacity-50"
              >
                {checkingOut ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Bundle Offer */}
        {bundle && (
          <section className="mb-16">
            <div className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-2xl overflow-hidden shadow-xl">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 lg:p-12 text-white">
                  <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full mb-4">
                    BEST VALUE - SAVE ${(Number(bundle.original_price) - Number(bundle.price)).toFixed(0)}
                  </span>
                  <h2 className="text-3xl font-bold mb-2">{bundle.title}</h2>
                  <p className="text-brand-blue-100 mb-6">{bundle.description}</p>
                  
                  <div className="mb-6">
                    <p className="text-sm text-brand-blue-200 mb-2">What&apos;s Included:</p>
                    <ul className="space-y-2">
                      {sortedFeatures(bundle.features || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span>{f.feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl font-bold">${Number(bundle.price).toFixed(0)}</span>
                    <span className="text-xl text-brand-blue-300 line-through">${Number(bundle.original_price).toFixed(0)}</span>
                  </div>

                  <button
                    onClick={() => addToCart(bundle.id)}
                    disabled={cart.includes(bundle.id)}
                    className="w-full sm:w-auto bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-50 transition disabled:bg-green-100 disabled:text-green-600 flex items-center justify-center gap-2"
                  >
                    {cart.includes(bundle.id) ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Get the Bundle
                      </>
                    )}
                  </button>
                </div>
                <div className="relative hidden lg:block">
                  <Image
                    src={bundle.image_url || '/images/heroes-hq/about-hero.jpg'}
                    alt={bundle.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Individual Courses */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Individual Courses</h2>
          
          {courses.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-gray-600">No courses available at this time. Contact us for more information.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col">
                  <div className="relative h-48">
                    <Image
                      src={course.image_url || '/images/business/program-tax-preparation.jpg'}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    {course.is_bestseller && (
                      <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                        BESTSELLER
                      </span>
                    )}
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {course.lesson_count} lessons
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-brand-blue-600 font-medium mb-3">{course.subtitle}</p>
                    <p className="text-gray-600 text-sm mb-4 flex-1">{course.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration_hours} hours
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        4.9
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">${Number(course.price).toFixed(0)}</span>
                          {course.original_price && (
                            <span className="text-gray-400 line-through">${Number(course.original_price).toFixed(0)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/career-services/courses/${course.slug}`}
                          className="flex-1 text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => addToCart(course.id)}
                          disabled={cart.includes(course.id)}
                          className="flex-1 bg-brand-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-blue-700 disabled:bg-green-600 flex items-center justify-center gap-1"
                        >
                          {cart.includes(course.id) ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
