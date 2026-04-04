'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, QrCode, RefreshCw, Copy, Check, 
  Clock, Users, AlertCircle, Loader2, Share2
} from 'lucide-react';

interface CheckInData {
  qrCode: string;
  shopId: string;
  shopName: string;
  expiresAt: string;
  todayCheckIns: number;
}

export default function ShopCheckInPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CheckInData | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQRCode = async () => {
    try {
      const response = await fetch('/api/shop/checkin/qr');
      if (!response.ok) {
        throw new Error('Failed to load QR code');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError('An error occurred');
    }
  };

  useEffect(() => {
    fetchQRCode().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQRCode();
    setRefreshing(false);
  };

  const handleCopy = async () => {
    if (data?.qrCode) {
      const checkInUrl = `${window.location.origin}/pwa/barber/checkin?code=${data.qrCode}`;
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (data?.qrCode && navigator.share) {
      const checkInUrl = `${window.location.origin}/pwa/barber/checkin?code=${data.qrCode}`;
      try {
        await navigator.share({
          title: `Check in at ${data.shopName}`,
          text: 'Use this link to check in for your apprenticeship hours',
          url: checkInUrl,
        });
      } catch (err) {
        // User cancelled
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Apprentice Check-In</h1>
            <p className="text-slate-500 text-sm">Display for apprentices to scan</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {error ? (
          <div className="bg-white/10 border border-brand-red-500/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-brand-red-400 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-brand-red-500 text-white px-6 py-2 rounded-xl font-medium"
            >
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {/* QR Code Display */}
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="w-64 h-64 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center">
                {/* QR Code SVG - In production, use a QR library */}
                <div className="relative">
                  <QrCode className="w-48 h-48 text-slate-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-2 rounded-lg">
                      <span className="text-xs font-mono text-slate-600">{data.qrCode.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 font-medium">{data.shopName}</p>
              <p className="text-slate-500 text-sm">Scan to check in</p>
            </div>

            {/* Manual Code */}
            <div className="bg-white rounded-xl p-4">
              <p className="text-slate-500 text-sm mb-2">Manual Check-In Code</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-brand-blue-700 rounded-xl px-4 py-3 font-mono text-white text-lg tracking-wider">
                  {data.qrCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-600"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-brand-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-brand-blue-400" />
                  <span className="text-slate-500 text-sm">Today's Check-Ins</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{data.todayCheckIns}</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-slate-500 text-sm">Code Expires</span>
                </div>
                <p className="text-lg font-bold text-slate-900">
                  {new Date(data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white font-medium py-4 rounded-xl hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                Generate New Code
              </button>

              {'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-medium py-4 rounded-xl hover:bg-brand-blue-700"
                >
                  <Share2 className="w-5 h-5" />
                  Share Check-In Link
                </button>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white/50 rounded-xl p-4">
              <h3 className="text-slate-900 font-medium mb-2">How it works</h3>
              <ol className="text-slate-400 text-sm space-y-2">
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">1.</span>
                  Display this QR code at your shop entrance
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">2.</span>
                  Apprentices scan the code when they arrive
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">3.</span>
                  Check-in time is automatically recorded
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">4.</span>
                  Hours are calculated when they check out
                </li>
              </ol>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
