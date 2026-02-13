'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import {
  Search,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface RefundStatus {
  status: 'received' | 'approved' | 'sent' | 'not_found';
  statusMessage: string;
  refundAmount?: number;
  expectedDate?: string;
  actualDate?: string;
  method?: 'direct_deposit' | 'check';
  lastUpdated: string;
}

export default function RefundTrackerPage() {
  const [ssn, setSsn] = useState('');
  const [filingStatus, setFilingStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState<RefundStatus | null>(null);
  const [error, setError] = useState('');

  const formatSSN = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    setSsn(formatted);
  };

  const trackRefund = async () => {
    setError('');
    setRefundStatus(null);

    // Validation
    if (!ssn || ssn.replace(/\D/g, '').length !== 9) {
      setError('Please enter a valid 9-digit SSN');
      return;
    }
    if (!filingStatus) {
      setError('Please select your filing status');
      return;
    }
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      setError('Please enter your expected refund amount');
      return;
    }

    setLoading(true);

    try {
      // Call refund tracking API
      const response = await fetch(
        '/api/supersonic-fast-cash/refund-tracking',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ssn: ssn.replace(/\D/g, ''),
            filingStatus,
            refundAmount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to track refund');
      }

      const result = await response.json();

      setRefundStatus({
        status: result.status,
        statusMessage: result.statusMessage,
        refundAmount: result.refundAmount,
        expectedDate: result.expectedDate,
        method: result.method,
        lastUpdated: result.lastUpdated,
      });
    } catch (err) {
      setError('Unable to retrieve refund status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Clock className="w-12 h-12 text-blue-600" />;
      case 'approved':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'sent':
        return <TrendingUp className="w-12 h-12 text-blue-600" />;
      default:
        return <AlertCircle className="w-12 h-12 text-black" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-600';
      case 'approved':
        return 'bg-green-600';
      case 'sent':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Refund Tracker" }]} />
      </div>
<div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
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
                  Social Security Number
                </label>
                <input
                  type="text"
                  value={ssn}
                  onChange={handleSSNChange}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                />
                <p className="text-xs text-black mt-1">
                  Your SSN is encrypted and secure
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Filing Status
                </label>
                <select
                  value={filingStatus}
                  onChange={(e) => setFilingStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select filing status...</option>
                  <option value="single">Single</option>
                  <option value="married_joint">Married Filing Jointly</option>
                  <option value="married_separate">
                    Married Filing Separately
                  </option>
                  <option value="head_of_household">Head of Household</option>
                  <option value="qualifying_widow">Qualifying Widow(er)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                    $
                  </span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="2,500"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-black mt-1">
                  Enter the exact amount from your tax return
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={trackRefund}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="mt-8 bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold mb-3">When to Check:</h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>E-filed:</strong> 24 hours after IRS accepts your
                    return
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Paper filed:</strong> 4 weeks after mailing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
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
                  <h2 className="text-3xl font-bold mb-2">Refund Status</h2>
                  <p className="text-lg opacity-90">
                    {refundStatus.statusMessage}
                  </p>
                </div>
                {getStatusIcon(refundStatus.status)}
              </div>

              {refundStatus.refundAmount && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium opacity-90">
                      Refund Amount
                    </span>
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="text-4xl font-bold mt-2">
                    ${refundStatus.refundAmount.toLocaleString()}
                  </div>
                </div>
              )}

              {refundStatus.expectedDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5" />
                  <span>
                    Expected deposit date:{' '}
                    <strong>
                      {new Date(refundStatus.expectedDate).toLocaleDateString(
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
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="w-0.5 h-full bg-green-600 mt-2"></div>
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
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div
                      className={`w-0.5 h-full mt-2 ${
                        refundStatus.status === 'sent'
                          ? 'bg-green-600'
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
                          ? 'bg-green-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Refund Sent</h4>
                    <p className="text-sm text-black">
                      Your refund has been sent via{' '}
                      {refundStatus.method === 'direct_deposit'
                        ? 'direct deposit'
                        : 'check'}
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
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
              >
                <Search className="w-4 h-4" />
                Check Another Refund
              </button>

              <a
                href="https://www.irs.gov/refunds"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-semibold transition"
              >
                IRS Official Site
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Refund Advance Offer */}
            {refundStatus.status !== 'sent' &&
              refundStatus.refundAmount &&
              refundStatus.refundAmount >= 250 && (
                <div className="bg-slate-700 rounded-2xl shadow-xl p-8 text-black">
                  <h3 className="text-2xl font-bold mb-3">
                    <DollarSign className="w-5 h-5 inline-block" /> Get Your
                    Money Today!
                  </h3>
                  <p className="text-lg mb-6">
                    Don't wait for your refund. Get up to $
                    {Math.min(refundStatus.refundAmount, 7500).toLocaleString()}{' '}
                    today with our refund advance.
                  </p>

                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Same-day funding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>3.5% + $35 fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>No credit check</span>
                    </div>
                  </div>

                  <a
                    href="/supersonic-fast-cash/book-appointment"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition"
                  >
                    Apply for Refund Advance →
                  </a>
                </div>
              )}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12 bg-gray-50 rounded-2xl p-8">
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
