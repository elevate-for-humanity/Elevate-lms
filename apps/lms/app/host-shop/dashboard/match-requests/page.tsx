'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Clock, CheckCircle, XCircle, AlertCircle, 
  Mail, Phone, Calendar, ChevronRight, User, ArrowRight,
  Filter, RefreshCw, MessageSquare
} from 'lucide-react';

interface ApprenticeProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  barber_license: string | null;
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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function HostShopMatchRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MatchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [actioning, setActioning] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<MatchRequest | null>(null);
  const [declineNote, setDeclineNote] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState<MatchRequest | null>(null);
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
      
      if (res.status === 401 || res.status === 403) {
        router.push('/login?redirect=/host-shop/dashboard/match-requests');
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

  async function handleAction(id: string, status: 'approved' | 'declined', note?: string) {
    setActioning(id);
    try {
      const res = await fetch(`/api/host-shop/match-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, shop_notes: note }),
      });
      const d = await res.json();
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? d.request : r));
      } else {
        alert(d.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Failed to update request:', error);
      alert('Failed to update request');
    } finally {
      setActioning(null);
      setDeclineModal(null);
      setShowApprovalModal(null);
      setDeclineNote('');
      setApprovalNote('');
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-pink-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Match Requests</h1>
              <p className="text-rose-100">
                {pendingCount > 0 
                  ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''} need${pendingCount === 1 ? 's' : ''} your review`
                  : 'Review and manage apprenticeship match requests'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchRequests(page)}
                className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-gray-600 font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter:
          </span>
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'declined', label: 'Declined' },
            { value: 'all', label: 'All' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
              }`}
            >
              {f.label}
              {f.value === 'pending' && pendingCount > 0 && (
                <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
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
                  <div className="w-16 h-16 bg-gray-200 rounded-xl" />
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
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'pending' ? 'No Pending Requests' : `No ${filter} Requests`}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {filter === 'pending' 
                ? 'You don\'t have any pending match requests to review. Check back later!'
                : `There are no ${filter} requests at this time.`}
            </p>
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
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Apprentice Avatar */}
                    <div className="flex-shrink-0">
                      {req.apprentice?.avatar_url ? (
                        <img
                          src={req.apprentice.avatar_url}
                          alt={req.apprentice.full_name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-rose-400" />
                        </div>
                      )}
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {req.apprentice?.full_name || 'Apprentice'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                            {req.apprentice?.email && (
                              <a
                                href={`mailto:${req.apprentice.email}`}
                                className="flex items-center gap-1 hover:text-rose-600"
                              >
                                <Mail className="w-4 h-4" />
                                {req.apprentice.email}
                              </a>
                            )}
                            {req.apprentice?.phone && (
                              <a
                                href={`tel:${req.apprentice.phone}`}
                                className="flex items-center gap-1 hover:text-rose-600"
                              >
                                <Phone className="w-4 h-4" />
                                {req.apprentice.phone}
                              </a>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>

                      {/* Program */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="font-medium text-gray-700">{req.program_slug}</span>
                      </div>

                      {/* Message from Apprentice */}
                      {req.message && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700">Message from Apprentice</span>
                          </div>
                          <p className="text-gray-700 text-sm italic">"{req.message}"</p>
                        </div>
                      )}

                      {/* Apprentice Notes */}
                      {req.apprentice_notes && (
                        <div className="bg-indigo-50 rounded-xl p-3 mb-3">
                          <p className="text-xs text-indigo-600 font-medium mb-1">Additional Notes</p>
                          <p className="text-gray-700 text-sm">{req.apprentice_notes}</p>
                        </div>
                      )}

                      {/* Shop Notes (for approved/declined) */}
                      {req.shop_notes && (
                        <div className={`rounded-xl p-3 ${
                          req.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <p className={`text-xs font-medium ${
                            req.status === 'approved' ? 'text-green-600' : 'text-red-600'
                          }`}>Your Response</p>
                          <p className="text-gray-700 text-sm mt-1">{req.shop_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {req.status === 'pending' && (
                      <div className="flex flex-col gap-2 lg:w-48">
                        <button
                          onClick={() => setShowApprovalModal(req)}
                          disabled={actioning === req.id}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {actioning === req.id ? 'Processing...' : 'Approve Match'}
                        </button>
                        <button
                          onClick={() => setDeclineModal(req)}
                          disabled={actioning === req.id}
                          className="w-full px-4 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Decline
                        </button>
                      </div>
                    )}

                    {req.status === 'approved' && (
                      <div className="flex flex-col gap-2 lg:w-48">
                        <div className="p-4 bg-green-50 rounded-xl text-center">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm font-medium text-green-800">Match Approved</p>
                          <p className="text-xs text-green-600 mt-1">An admin will create the placement record.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/host-shop/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-rose-600 transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Approve Match Request</h3>
                <p className="text-gray-500 text-sm">from {showApprovalModal.apprentice?.full_name}</p>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">
              By approving this request, you'll officially match with this apprentice. 
              An admin will create the formal placement record.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add a welcome note (optional)
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Welcome to the team! We're excited to have you..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(null);
                  setApprovalNote('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showApprovalModal.id, 'approved', approvalNote)}
                disabled={actioning === showApprovalModal.id}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {actioning === showApprovalModal.id ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {declineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Decline Request</h3>
                <p className="text-gray-500 text-sm">from {declineModal.apprentice?.full_name}</p>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              Are you sure you want to decline this match request? The apprentice will be notified.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for declining (optional)
              </label>
              <textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="We regret to inform you that..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeclineModal(null);
                  setDeclineNote('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(declineModal.id, 'declined', declineNote)}
                disabled={actioning === declineModal.id}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                {actioning === declineModal.id ? 'Processing...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
