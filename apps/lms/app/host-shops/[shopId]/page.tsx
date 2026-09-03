'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, Phone, Mail, Clock, Star, Users, Calendar, 
  CheckCircle, ArrowLeft, Send, AlertCircle, ChevronLeft 
} from 'lucide-react';

interface HostShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  services: string[];
  specializations: string[];
  years_experience: number;
  mentor_count: number;
  spots_available: number;
  availability_notes: string;
  active_days: string[];
  hours: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number;
  description: string;
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<HostShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/host-shops/available?search=${encodeURIComponent(shopId)}&limit=1`);
      const data = await res.json();
      
      // Find the shop by ID
      const foundShop = data.shops?.find((s: HostShop) => s.id === shopId);
      if (foundShop) {
        setShop(foundShop);
      } else {
        setError('Shop not found');
      }
    } catch (err) {
      setError('Failed to load shop details');
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/host-shop/match-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_shop_id: shopId,
          program_slug: 'barber-apprenticeship',
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/apprentice/match-requests');
        }, 2000);
      } else if (res.status === 409) {
        setSubmitError('You already have a pending or approved request for this shop.');
      } else if (res.status === 401) {
        router.push(`/login?redirect=/host-shops/${shopId}`);
      } else {
        setSubmitError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-gray-600">
          {rating.toFixed(1)} ({shop?.review_count || 0} reviews)
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="h-64 bg-gray-200 rounded-xl mb-6" />
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'This shop may no longer be available.'}</p>
          <Link
            href="/host-shops"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Host Shops
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link
            href="/host-shops"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Host Shops
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          {/* Shop Image */}
          <div className="relative h-64 lg:h-80 bg-gradient-to-br from-purple-100 to-indigo-100">
            {shop.image_url ? (
              <img
                src={shop.image_url}
                alt={shop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-purple-200 rounded-full p-8">
                  <Users className="w-16 h-16 text-purple-600" />
                </div>
              </div>
            )}
            
            {/* Availability Badge */}
            <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-semibold text-purple-700">
                {shop.spots_available} spot{shop.spots_available !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>

          {/* Shop Header Info */}
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
                
                {/* Rating */}
                {shop.rating && (
                  <div className="mb-3">
                    {getStars(shop.rating)}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5" />
                  <span>
                    {shop.address && `${shop.address}, `}
                    {shop.city}, {shop.state} {shop.zip_code}
                  </span>
                </div>

                {/* Experience & Mentors */}
                <div className="flex flex-wrap gap-4">
                  {shop.years_experience && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <span>{shop.years_experience} years experience</span>
                    </div>
                  )}
                  {shop.mentor_count && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-5 h-5 text-purple-500" />
                      <span>{shop.mentor_count} mentor{shop.mentor_count !== 1 ? 's' : ''} on staff</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-3">
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Phone className="w-5 h-5 text-purple-500" />
                    <span>{shop.phone}</span>
                  </a>
                )}
                {shop.email && (
                  <a
                    href={`mailto:${shop.email}`}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Mail className="w-5 h-5 text-purple-500" />
                    <span>{shop.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Shop</h2>
              
              {shop.description ? (
                <p className="text-gray-600 leading-relaxed">{shop.description}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {shop.owner_name ? `${shop.owner_name}'s shop is dedicated to training the next generation of beauty professionals. ` : ''}
                  They welcome apprentices who are committed to learning and growing in their craft.
                </p>
              )}

              {/* Owner Info */}
              {shop.owner_name && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
                  <p className="text-gray-600">{shop.owner_name}</p>
                </div>
              )}

              {/* Services */}
              {shop.services && shop.services.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Services Offered</h3>
                  <div className="flex flex-wrap gap-2">
                    {shop.services.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specializations */}
              {shop.specializations && shop.specializations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {shop.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule & Availability</h2>
              
              {/* Hours */}
              {shop.hours && (
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900">Business Hours</p>
                    <p className="text-gray-600">{shop.hours}</p>
                  </div>
                </div>
              )}

              {/* Active Days */}
              {shop.active_days && shop.active_days.length > 0 && (
                <div className="mb-6">
                  <p className="font-medium text-gray-900 mb-3">Active Days</p>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isActive = shop.active_days.includes(day);
                      return (
                        <span
                          key={day}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day.slice(0, 3)}
                          {isActive && <CheckCircle className="inline w-4 h-4 ml-1" />}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Availability Notes */}
              {shop.availability_notes && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> {shop.availability_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Request to Match */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:sticky lg:top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Request to Match</h2>
              
              <p className="text-gray-600 mb-6">
                Interested in training at {shop.name}? Send a match request to get started.
              </p>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Sent!</h3>
                  <p className="text-gray-500">Redirecting you to your requests...</p>
                </div>
              ) : showRequestForm ? (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to the Shop (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Introduce yourself and explain why you'd like to train at this shop..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestForm(false);
                        setSubmitError(null);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full px-6 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Request to Match
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">What happens next?</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>The shop owner will review your request</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>You'll be notified when they respond</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Start your training journey!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
