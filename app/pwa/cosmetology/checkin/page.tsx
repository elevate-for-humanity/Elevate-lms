'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, CheckCircle, Loader2, Scissors, BookOpen, TrendingUp } from 'lucide-react';

const NAV = [
  { href: '/pwa/cosmetology', icon: Scissors, label: 'Home' },
  { href: '/pwa/cosmetology/log-hours', icon: Clock, label: 'Log' },
  { href: '/pwa/cosmetology/training', icon: BookOpen, label: 'Learn' },
  { href: '/pwa/cosmetology/progress', icon: TrendingUp, label: 'Progress' },
];

export default function CosmetologyCheckinPage() {
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
          const res = await fetch('/api/pwa/cosmetology/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          });
          if (res.ok) {
            setStatus('success');
            setMessage('Check-in recorded successfully.');
          } else {
            const d = await res.json();
            setStatus('error');
            setMessage(d.error ?? 'Check-in failed. Try again.');
          }
        } catch {
          setStatus('error');
          setMessage('Network error. Please try again.');
        }
      },
      () => {
        setStatus('error');
        setMessage('Could not get your location. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-purple-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Salon Check-In</h1>
        </div>
      </header>

      <main className="px-4 py-10 flex flex-col items-center text-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all ${
          status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500/20' : 'bg-purple-600'
        }`}>
          {status === 'locating' && <Loader2 className="w-16 h-16 text-white animate-spin" />}
          {status === 'success' && <CheckCircle className="w-16 h-16 text-white" />}
          {status === 'error' && <MapPin className="w-16 h-16 text-red-400" />}
          {status === 'idle' && <MapPin className="w-16 h-16 text-white" />}
        </div>

        {status === 'idle' && (
          <>
            <h2 className="text-white text-2xl font-bold mb-3">Check In to Your Salon</h2>
            <p className="text-slate-400 mb-8 max-w-xs">Tap the button below to record your arrival at your training salon. Your location will be verified.</p>
            <button onClick={handleCheckin} className="px-10 py-4 bg-purple-600 text-white font-bold rounded-2xl text-lg hover:bg-purple-700 transition-colors">
              Check In Now
            </button>
          </>
        )}

        {status === 'locating' && (
          <>
            <h2 className="text-white text-2xl font-bold mb-3">Getting Your Location...</h2>
            <p className="text-slate-400">Please wait while we verify your location.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-white text-2xl font-bold mb-3">Checked In!</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <Link href="/pwa/cosmetology/log-hours" className="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors">
              Log Today&apos;s Hours
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-white text-2xl font-bold mb-3">Check-In Failed</h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <button onClick={() => setStatus('idle')} className="px-8 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors">
              Try Again
            </button>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 text-slate-400">
              <Icon className="w-6 h-6" /><span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
