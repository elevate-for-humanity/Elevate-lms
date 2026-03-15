'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import {
  Search,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
  ExternalLink,
  RefreshCw,
CheckCircle, } from 'lucide-react';

interface RefundStatus {
  status: string;
  statusMessage: string;
  trackingCode?: string;
  clientName?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RefundTrackerPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [error, setError] = useState('');

  const trackRefund = async () => {
    setError('');
    setRefundStatus(null);

    const code = trackingCode.trim();
    if (!code || code.length < 6) {
      setError('Please enter your tracking code (provided when your return was filed).');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        '/api/supersonic-fast-cash/refund-tracking',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingCode: code }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'No return found for the provided tracking code.');
        return;
      }

      setRefundStatus({
        status: result.status,
        statusMessage: result.statusMessage,
        trackingCode: result.trackingCode,
        clientName: result.clientName,
        rejectionReason: result.rejectionReason,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    } catch {
      setError('Unable to retrieve refund status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Clock className="w-12 h-12 text-brand-blue-200" />;
      case 'processing':
      case 'submitted':
        return <TrendingUp className="w-12 h-12 text-brand-blue-200" />;
      case 'accepted':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'action_required':
        return <AlertCircle className="w-12 h-12 text-brand-red-200" />;
      default:
        return <Clock className="w-12 h-12 text-gray-200" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-brand-green-600';
      case 'action_required':
        return 'bg-brand-red-600';
      case 'submitted':
        return 'bg-brand-blue-700';
      default:
        return 'bg-brand-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Refund Tracker" }]} />
      </div>
<div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-green-100 text-brand-green-700 px-4 py-2 rounded-full mb-4">
            <Search className="w-4 h-4" />
            <span className="text-sm font-semibold">IRS Refund Tracker</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Where's My Refund?
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Track your federal tax refund status in real-time. Connected to IRS
            systems.
          </p>
        </div>

        {!refundStatus ? (
          /* Input Form */
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">
              Check Your Refund Status
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tracking Code
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="SFC-1234567890-ABCD"
                  maxLength={40}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-green-500 focus:outline-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the tracking code provided when your return was filed
                </p>
              </div>

              {error && (
                <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
                    <p className="text-sm text-brand-red-700">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={trackRefund}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-green-600 text-white rounded-xl font-bold text-lg hover:bg-brand-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track My Refund
                  </>
                )}
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-brand-blue-50 rounded-xl p-6">
              <h3 className="font-semibold mb-3">When to Check:</h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>
                    <strong>E-filed:</strong> 24 hours after IRS accepts your
                    return
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>
                    <strong>Paper filed:</strong> 4 weeks after mailing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>
                    <strong>Amended return:</strong> 3 weeks after filing
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Status Display */
          <div className="space-y-6">
            {/* Main Status Card */}
            <div
              className={`${getStatusColor(
                refundStatus.status
              )} rounded-2xl shadow-xl p-8 text-white`}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Return Status</h2>
                  <p className="text-lg opacity-90">
                    {refundStatus.statusMessage}
                  </p>
                </div>
                {getStatusIcon(refundStatus.status)}
              </div>

              {refundStatus.clientName && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <span className="text-sm font-medium opacity-90">Filed for: </span>
                  <span className="font-bold">{refundStatus.clientName}</span>
                </div>
              )}

              {refundStatus.rejectionReason && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                  <span className="text-sm font-medium opacity-90">Action needed: </span>
                  <span>{refundStatus.rejectionReason}</span>
                </div>
              )}

              {refundStatus.updatedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5" />
                  <span>
                    Last updated:{' '}
                    <strong>
                      {new Date(refundStatus.updatedAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Refund Timeline</h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-brand-green-600 rounded-full flex items-center justify-center">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    </div>
                    <div className="w-0.5 h-full bg-brand-green-600 mt-2"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold mb-1">Return Received</h4>
                    <p className="text-sm text-black">
                      Your tax return has been received and is being processed
                    </p>
                    <p className="text-xs text-black mt-1">Completed</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        refundStatus.status === 'approved' ||
                        refundStatus.status === 'sent'
                          ? 'bg-brand-green-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    </div>
                    <div
                      className={`w-0.5 h-full mt-2 ${
                        refundStatus.status === 'sent'
                          ? 'bg-brand-green-600'
                          : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold mb-1">Refund Approved</h4>
                    <p className="text-sm text-black">
                      Your refund has been approved and will be sent soon
                    </p>
                    <p className="text-xs text-black mt-1">
                      {refundStatus.status === 'approved' ||
                      refundStatus.status === 'sent'
                        ? 'Completed'
                        : 'In Progress'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        refundStatus.status === 'sent'
                          ? 'bg-brand-green-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Refund Sent</h4>
                    <p className="text-sm text-black">
                      Your return has been accepted and your refund is on the way
                    </p>
                    <p className="text-xs text-black mt-1">
                      {refundStatus.status === 'sent' ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setRefundStatus(null)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-200 rounded-xl font-semibold transition"
              >
                <Search className="w-4 h-4" />
                Check Another Refund
              </button>

              <a
                href="https://www.irs.gov/refunds"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue-600 text-white hover:bg-brand-blue-700 rounded-xl font-semibold transition"
              >
                IRS Official Site
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>


          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-6">Frequently Asked Questions</h3>

          <div className="space-y-4">
            <details className="bg-white rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">
                How long does it take to get my refund?
              </summary>
              <p className="text-sm text-black mt-2">
                Most refunds are issued within 21 days of e-filing. Direct
                deposit is faster than paper checks.
              </p>
            </details>

            <details className="bg-white rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">
                Why is my refund delayed?
              </summary>
              <p className="text-sm text-black mt-2">
                Common reasons include errors on your return, identity
                verification, claiming certain credits (EITC, ACTC), or amended
                returns.
              </p>
            </details>

            <details className="bg-white rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">
                Can I change my direct deposit information?
              </summary>
              <p className="text-sm text-black mt-2">
                Once your return is submitted, you cannot change your direct
                deposit information. Contact the IRS if you need to update it.
              </p>
            </details>

            <details className="bg-white rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">
                What if my refund is less than expected?
              </summary>
              <p className="text-sm text-black mt-2">
                The IRS may have adjusted your refund due to errors, offsets for
                debts, or other issues. Check your IRS notice for details.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
