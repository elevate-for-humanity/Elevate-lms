'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Clock, Star, Users, ChevronRight, Filter } from 'lucide-react';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const POPULAR_CITIES = [
  'Indianapolis', 'Fort Wayne', 'Carmel', 'Bloomington', 'Evansville',
  'South Bend', 'Gary', 'Muncie', 'Lafayette', 'Terre Haute'
];

export default function HostShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<HostShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  const fetchShops = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (city) params.set('city', city);

      const res = await fetch(`/api/host-shops/available?${params.toString()}`);
      const data = await res.json();

      if (data.shops) {
        setShops(data.shops);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  }, [search, city]);

  useEffect(() => {
    fetchShops(1);
    setPage(1);
  }, [fetchShops]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShops(1);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchShops(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Find Your Host Shop
            </h1>
            <p className="text-lg lg:text-xl text-purple-100 mb-8">
              Connect with local barbershops and salons committed to training the next generation 
              of beauty professionals. Start your hands-on apprenticeship journey today.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by shop name or owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-300"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowCityFilter(!showCityFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-purple-300 transition"
            >
              <Filter className="w-4 h-4" />
              Filter by City
            </button>
            {city && (
              <button
                onClick={() => setCity('')}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Clear filter
              </button>
            )}
          </div>
          
          {showCityFilter && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm text-gray-500 mb-3">Select a city in Indiana:</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      city === c
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {city ? `${city} Area` : 'All Locations'}
            </h2>
            {pagination && (
              <p className="text-gray-500 mt-1">
                {pagination.total} host shop{pagination.total !== 1 ? 's' : ''} available
                {city && ` in ${city}`}
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="w-full h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Host Shops Found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {search || city
                ? 'Try adjusting your search or filter to find more host shops.'
                : 'We don\'t have any host shops accepting apprentices right now. Check back soon!'}
            </p>
            {(search || city) && (
              <button
                onClick={() => {
                  setSearch('');
                  setCity('');
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          /* Shop Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/host-shops/${shop.id}`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-200 transition-all duration-300"
                >
                  {/* Shop Image */}
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
                    {shop.image_url ? (
                      <img
                        src={shop.image_url}
                        alt={shop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="bg-purple-200 rounded-full p-6">
                          <Users className="w-12 h-12 text-purple-600" />
                        </div>
                      </div>
                    )}
                    {/* Spots Badge */}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-sm">
                      <span className="text-sm font-semibold text-purple-700">
                        {shop.spots_available} spot{shop.spots_available !== 1 ? 's' : ''} open
                      </span>
                    </div>
                  </div>

                  {/* Shop Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition">
                      {shop.name}
                    </h3>
                    
                    {/* Location */}
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {shop.city}, {shop.state}
                        {shop.address && ` • ${shop.address}`}
                      </span>
                    </div>

                    {/* Rating */}
                    {shop.rating && getStars(shop.rating)}

                    {/* Services */}
                    {shop.services && shop.services.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {shop.services.slice(0, 3).map((service) => (
                          <span
                            key={service}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {service}
                          </span>
                        ))}
                        {shop.services.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                            +{shop.services.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Hours */}
                    {shop.hours && (
                      <div className="flex items-center gap-1 text-gray-500 text-sm mt-3">
                        <Clock className="w-4 h-4" />
                        <span>{shop.hours}</span>
                      </div>
                    )}

                    {/* Owner */}
                    {shop.owner_name && (
                      <p className="text-sm text-gray-500 mt-3">
                        Owner: {shop.owner_name}
                      </p>
                    )}

                    {/* CTA */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="flex items-center justify-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                        Request to Match
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(pagination.pages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                            pageNum === page
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-purple-100 mb-8 text-lg">
            Browse host shops, request a match, and begin your professional apprenticeship today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apprentice/match-requests"
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition"
            >
              View My Requests
            </Link>
            <Link
              href="/programs"
              className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
