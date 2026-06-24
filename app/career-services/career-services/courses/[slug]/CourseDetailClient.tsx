'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Tag, X, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  slug: string;
  title: string;
  price: number;
  original_price: number;
}

export function CourseDetailClient({ course }: { course: Course }) {
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [validating, setValidating] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    
    setValidating(true);
    setPromoError('');

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          courseIds: [course.id],
          subtotal: Number(course.price),
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setPromoApplied(data);
      } else {
        setPromoError(data.error || 'Invalid promo code');
        setPromoApplied(null);
      }
    } catch (error) {
      setPromoError('Failed to validate code');
    } finally {
      setValidating(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);

    try {
      const res = await fetch('/api/checkout/career-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseIds: [course.id],
          promoCode: promoApplied?.promo?.code,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      alert('Failed to process purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const finalPrice = promoApplied ? promoApplied.newTotal : Number(course.price);

  // Reinitialize Sezzle widget when price changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Sezzle) {
      (window as any).Sezzle.init();
    }
  }, [finalPrice]);

  return (
    <>
      {/* Promo Code Section */}
      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Tag className="w-6 h-6 text-brand-blue-600" />
              <span className="font-medium text-slate-900">Have a promo code?</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="px-4 py-2 border rounded-lg w-40 uppercase"
                  disabled={!!promoApplied}
                />
                {promoApplied ? (
                  <button
                    onClick={() => {
                      setPromoApplied(null);
                      setPromoCode('');
                    }}
                    className="px-4 py-2 text-brand-red-600 hover:bg-brand-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={validatePromo}
                    disabled={validating || !promoCode.trim()}
                    className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-300"
                  >
                    {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
                  </button>
                )}
              </div>
              {promoApplied && (
                <span className="flex items-center gap-1 text-brand-green-600 text-sm">
                  <span className="text-black flex-shrink-0">•</span>
                  {promoApplied.promo.description} - Save ${promoApplied.discountAmount.toFixed(2)}
                </span>
              )}
              {promoError && (
                <span className="text-brand-red-600 text-sm">{promoError}</span>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:bg-gray-400"
              >
                {purchasing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                {promoApplied ? (
                  <>
                    Buy Now - <span className="line-through opacity-70">${Number(course.price).toFixed(0)}</span> ${finalPrice.toFixed(0)}
                  </>
                ) : (
                  `Buy Now - $${Number(course.price).toFixed(0)}`
                )}
              </button>
              {/* Sezzle Widget */}
              {finalPrice >= 35 && finalPrice <= 2500 && (
                <div className="sezzle-widget-container">
                  <span className="sezzle-price-target" style={{ display: 'none' }}>${finalPrice.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Buy Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">{course.title}</h3>
              <div className="flex items-center gap-2">
                {promoApplied ? (
                  <>
                    <span className="text-xl font-bold text-brand-blue-600">${finalPrice.toFixed(0)}</span>
                    <span className="text-black line-through">${Number(course.price).toFixed(0)}</span>
                    <span className="text-brand-green-600 text-sm">({promoApplied.promo.code} applied)</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl font-bold text-brand-blue-600">${Number(course.price).toFixed(0)}</span>
                    {course.original_price && (
                      <span className="text-black line-through">${Number(course.original_price).toFixed(0)}</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-blue-700 disabled:bg-gray-400"
            >
              {purchasing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Enroll Now
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
