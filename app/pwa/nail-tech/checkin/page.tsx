'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, CheckCircle, Loader2, Sparkles, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/nail-tech', icon: Sparkles, label: 'Home' },
  { href: '/pwa/nail-tech/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/nail-tech/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/nail-tech/progress', icon: TrendingUp, label: 'Progress' },
];

export default function NailTechCheckinPage() {
  const [status, setStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleCheckin = async () => {
    setStatus('locating');
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/pwa/nail-tech/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
          const data = await res.json();
          if (res.ok) {
            setStatus('success');
            setMessage(data.message || 'Check-in recorded successfully.');
          } else {
            setStatus('error');
            setMessage(data.error || 'Check-in failed. Please try again.');
          }
        } catch {
          setStatus('error');
          setMessage('Network error. Please try again.');
        }
      },
      () => {
        setStatus('error');
        setMessage('Unable to get your location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-pink-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/pwa/nail-tech" className="w-10 h-10 bg-pink-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Check In</h1>
        </div>
        <p className="text-pink-200 text-sm">Verify your location to record attendance at your training site.</p>
      </header>

      <main className="px-4 py-8 flex flex-col items-center gap-6">
        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center">
          {status === 'locating' ? (
            <Loader2 className="w-16 h-16 text-pink-400 animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle className="w-16 h-16 text-green-400" />
          ) : (
            <MapPin className="w-16 h-16 text-pink-400" />
          )}
        </div>

        {message && (
          <div className={`w-full rounded-xl p-4 text-center text-sm font-medium ${status === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {message}
          </div>
        )}

        {status !== 'success' && (
          <button
            onClick={handleCheckin}
            disabled={status === 'locating'}
            className="w-full py-4 bg-pink-600 text-white font-bold text-lg rounded-xl disabled:opacity-50 hover:bg-pink-700 transition"
          >
            {status === 'locating' ? 'Locating...' : 'Check In Now'}
          </button>
        )}

        <p className="text-slate-500 text-xs text-center">
          You must be within range of your approved training site to check in.
        </p>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex safe-area-inset-bottom">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-pink-400 transition">
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
