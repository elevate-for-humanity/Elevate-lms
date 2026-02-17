"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Share2,
  Gift,
  Award
} from 'lucide-react';

interface ReferralDashboardProps {
  userId: string;
}

export default function ReferralDashboard({ userId }: ReferralDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch('/api/referrals?action=stats');
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch referral codes
      const codesRes = await fetch('/api/referrals?action=my-codes');
      const codesData = await codesRes.json();
      if (codesData.codes && codesData.codes.length > 0) {
        setReferralCode(codesData.codes[0].code);
      }

      // Fetch referrals
      const referralsRes = await fetch('/api/referrals?action=my-referrals');
      const referralsData = await referralsRes.json();
      setReferrals(referralsData.referrals || []);
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const shareText = `Join Elevate for Humanity and get 10% off! Use my referral code: ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Elevate for Humanity',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Referral Program</h1>
        <p className="text-black mt-2">
          Earn rewards by referring friends and family to Elevate for Humanity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Total Referrals</p>
              <p className="text-3xl font-bold text-black mt-2">
                {stats?.totalReferrals || 0}
              </p>
            </div>
            <Users className="w-12 h-12 text-brand-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Completed</p>
              <p className="text-3xl font-bold text-brand-green-600 mt-2">
                {stats?.completedReferrals || 0}
              </p>
            </div>
            <Check className="w-12 h-12 text-brand-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Total Earnings</p>
              <p className="text-3xl font-bold text-brand-orange-600 mt-2">
                ${stats?.totalEarnings?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-brand-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats?.conversionRate?.toFixed(1) || 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="   rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
            <p className="text-brand-blue-100 mb-6">
              Share this code with friends and earn $50 for each completed referral!
            </p>

            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-brand-blue-100 mb-1">Referral Code</p>
                <p className="text-3xl font-bold tracking-wider">{referralCode || 'Loading...'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors font-semibold"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-black mb-6">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-brand-blue-600" />
            </div>
            <h4 className="font-semibold text-black mb-2">1. Share Your Code</h4>
            <p className="text-sm text-black">
              Share your unique referral code with friends and family
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-brand-green-600" />
            </div>
            <h4 className="font-semibold text-black mb-2">2. They Sign Up</h4>
            <p className="text-sm text-black">
              Your friends get 10% off when they use your code
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-brand-orange-600" />
            </div>
            <h4 className="font-semibold text-black mb-2">3. Earn Rewards</h4>
            <p className="text-sm text-black">
              You earn $50 when they complete their first course
            </p>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      {stats && (stats.totalEarnings > 0 || stats.pendingEarnings > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-black mb-6">Earnings Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-brand-green-50 rounded-lg">
              <div>
                <p className="text-sm text-black">Paid Earnings</p>
                <p className="text-2xl font-bold text-brand-green-600">
                  ${stats.paidEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <Check className="w-8 h-8 text-brand-green-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-black">Pending Earnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${stats.pendingEarnings?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600" />
            </div>

            {stats.pendingEarnings > 50 && (
              <button className="w-full py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-semibold">
                Request Payout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recent Referrals */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-black">Recent Referrals</h3>
        </div>

        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-black">
                        {referral.referred_user?.first_name} {referral.referred_user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {referral.referred_user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        referral.status === 'completed'
                          ? 'bg-brand-green-100 text-brand-green-800'
                          : referral.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-black'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {referral.reward_amount ? `$${referral.reward_amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-black">No referrals yet. Start sharing your code!</p>
          </div>
        )}
      </div>
    </div>
  );
}
