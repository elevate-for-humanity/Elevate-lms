'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Clock, Star, Users, ChevronRight, CheckCircle, 
  XCircle, AlertCircle, ArrowRight, Calendar, ExternalLink, RefreshCw 
} from 'lucide-react';

interface ApprenticeProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
}

interface ShopInfo {
  id: string;
  name: string;
  business_name: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  image_url: string | null;
  owner_name: string;
  owner_email: string;
}

interface Placement {
  id: string;
  status: string;
  start_date: string;
}

interface MatchRequest {
  id: string;
  status: 'pending' | 'approved' | 'declined' | 'withdrawn' | 'expired';
  message: string | null;
  apprentice_notes: string | null;
  shop_notes: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string | null;
  program_slug: string;
  apprentice: ApprenticeProfile | null;
  shop: ShopInfo | null;
  placement: Placement | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function MyMatchRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);

  const fetchRequests = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '10');
      if (filter) params.set('status', filter);

      const res = await fetch(`/api/host-shop/match-requests?${params.toString()}`);
      
      if (res.status === 401) {
        router.push('/login?redirect=/apprentice/match-requests');
        return;
      }

      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    fetchRequests(1);
    setPage(1);
  }, [fetchRequests]);

  const filtered = filter ? requests.filter(r => r.status === filter) : requests;

  const getShopName = (shop: ShopInfo | null) => {
    return shop?.name || shop?.business_name || 'Host Shop';
  };

  const getShopAddress = (shop: ShopInfo | null) => {
    if (!shop) return '';
    const parts = [shop.city, shop.state].filter(Boolean);
    return parts.join(', ');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      declined: 'bg-red-100 text-red-700 border-red-200',
      withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
      expired: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      declined: <XCircle className="w-4 h-4" />,
      withdrawn: <AlertCircle className="w-4 h-4" />,
      expired: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons] || icons.pending}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">My Match Requests</h1>
          <p className="text-purple-100">Track and manage your host shop match requests</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-gray-600 font-medium">Filter by status:</span>
          {['', 'pending', 'approved', 'declined', 'withdrawn'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setFilter(s);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s
                  ? 'bg-white text-purple-700'
                  : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              {s === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter ? `No ${filter} requests found` : 'No Match Requests Yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {filter 
                ? 'Try selecting a different filter to see more requests.'
                : "You haven't requested to match with any host shops yet. Start exploring to find your perfect match!"}
            </p>
            <Link
              href="/host-shops"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Browse Host Shops
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          /* Requests List */
          <div className="space-y-4">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Shop Image */}
                    <div className="flex-shrink-0">
                      {req.shop?.image_url ? (
                        <img
                          src={req.shop.image_url}
                          alt={getShopName(req.shop)}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <Link
                            href={`/host-shops/${req.shop?.id}`}
                            className="text-xl font-bold text-gray-900 hover:text-purple-600 transition"
                          >
                            {getShopName(req.shop)}
                          </Link>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{getShopAddress(req.shop)}</span>
                          </div>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>

                      {/* Program */}
                      <p className="text-sm text-gray-500 mb-3">
                        Program: <span className="font-medium text-gray-700">{req.program_slug}</span>
                      </p>

                      {/* Message */}
                      {req.message && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">"{req.message}"</p>
                      )}

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span>Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {req.responded_at && (
                          <span>Responded {new Date(req.responded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                      </div>

                      {/* Shop Notes (for approved/declined) */}
                      {req.shop_notes && (
                        <div className={`mt-3 p-3 rounded-lg text-sm ${
                          req.status === 'approved' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          <p className="font-medium">Shop Response:</p>
                          <p>{req.shop_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/host-shops/${req.shop?.id}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                      >
                        View Shop
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      
                      {req.status === 'approved' && (
                        <Link
                          href="/apprentice"
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
                        >
                          Start Training
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approved State - Extended Info */}
                {req.status === 'approved' && (
                  <div className="bg-green-50 border-t border-green-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Congratulations! You've been matched!</span>
                        </div>
                        {req.placement?.start_date && (
                          <span className="text-sm text-green-700">
                            Started: {new Date(req.placement.start_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <Link
                        href="/apprentice"
                        className="text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
                      >
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Pending State - Info */}
                {req.status === 'pending' && (
                  <div className="bg-amber-50 border-t border-amber-100 px-6 py-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">
                        Awaiting shop review. You'll receive a notification when they respond.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setPage(page - 1);
                fetchRequests(page - 1);
              }}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-600">
              Page {page} of {pagination.pages}
            </span>

            <button
              onClick={() => {
                setPage(page + 1);
                fetchRequests(page + 1);
              }}
              disabled={page === pagination.pages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Looking for more opportunities?</p>
          <Link
            href="/host-shops"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Browse More Host Shops
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
