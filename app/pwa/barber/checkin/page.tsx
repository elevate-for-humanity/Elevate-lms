'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, QrCode, Camera, 
  Clock, MapPin, AlertCircle, Loader2, LogOut,
  Keyboard
} from 'lucide-react';

type CheckInStatus = 'idle' | 'checking' | 'checked-in' | 'error';

interface ActiveSession {
  shopName: string;
  checkInTime: string;
  duration: number;
}

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for active session on load
  useEffect(() => {
    checkActiveSession();
  }, []);

  // Handle code from URL
  useEffect(() => {
    if (codeFromUrl && status === 'idle') {
      handleCheckIn(codeFromUrl);
    }
  }, [codeFromUrl]);

  // Update elapsed time for active session
  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        const checkInDate = new Date(activeSession.checkInTime);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - checkInDate.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const checkActiveSession = async () => {
    try {
      const response = await fetch('/api/checkin/status');
      if (response.ok) {
        const data = await response.json();
        if (data.activeSession) {
          setActiveSession(data.activeSession);
          setStatus('checked-in');
        }
      }
    } catch (err) {
      console.error('Failed to check session:', err);
    }
  };

  const handleCheckIn = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a check-in code');
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      setActiveSession({
        shopName: data.shopName,
        checkInTime: data.checkInTime,
        duration: 0,
      });
      setStatus('checked-in');
      setManualCode('');
    } catch (err: any) {
      setError('An error occurred');
      setStatus('error');
    }
  };

  const handleCheckOut = async () => {
    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/checkin/checkout', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-out failed');
      }

      // Show success briefly then redirect
      setActiveSession(null);
      setStatus('idle');
      router.push('/pwa/barber?checkout=success&hours=' + data.hoursLogged);
    } catch (err: any) {
      setError('An error occurred');
      setStatus('error');
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Active session view
  if (status === 'checked-in' && activeSession) {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-green-600 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Checked In</h1>
              <p className="text-green-100 text-sm">Session active</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          {/* Active Session Card */}
          <div className="bg-green-500 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're Checked In!</h2>
            <div className="flex items-center justify-center gap-2 text-green-100 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{activeSession.shopName}</span>
            </div>
            
            {/* Timer */}
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <p className="text-green-100 text-sm mb-1">Time Elapsed</p>
              <p className="text-4xl font-mono font-bold text-white">
                {formatElapsedTime(elapsedTime)}
              </p>
            </div>

            <p className="text-green-100 text-sm">
              Checked in at {new Date(activeSession.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Check Out Button */}
          <button
            onClick={handleCheckOut}
            disabled={status === 'checking'}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {status === 'checking' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking out...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Check Out
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-slate-400 text-sm">
              Your hours will be automatically logged when you check out. Make sure to check out before leaving the shop.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Check-in view
  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Check In</h1>
            <p className="text-slate-400 text-sm">Scan QR or enter code</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-200 text-sm">{error}</p>
              <button 
                onClick={() => { setError(null); setStatus('idle'); }}
                className="text-red-400 text-sm underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {status === 'checking' ? (
          <div className="bg-slate-800 rounded-2xl p-12 text-center">
            <Loader2 className="w-16 h-16 text-brand-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-white font-medium">Checking in...</p>
          </div>
        ) : (
          <>
            {/* QR Scanner Placeholder */}
            {!showManualEntry && (
              <div className="bg-slate-800 rounded-2xl p-6">
                <div className="aspect-square bg-slate-700 rounded-xl flex flex-col items-center justify-center mb-4">
                  <Camera className="w-16 h-16 text-slate-500 mb-4" />
                  <p className="text-slate-400 text-center px-4">
                    Camera access required for QR scanning
                  </p>
                  <button className="mt-4 bg-brand-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium">
                    Enable Camera
                  </button>
                </div>
                <p className="text-slate-500 text-sm text-center">
                  Point your camera at the shop's QR code
                </p>
              </div>
            )}

            {/* Manual Entry Toggle */}
            <button
              onClick={() => {
                setShowManualEntry(!showManualEntry);
                if (!showManualEntry) {
                  setTimeout(() => inputRef.current?.focus(), 100);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-300 font-medium py-4 rounded-xl hover:bg-slate-700"
            >
              <Keyboard className="w-5 h-5" />
              {showManualEntry ? 'Hide Manual Entry' : 'Enter Code Manually'}
            </button>

            {/* Manual Code Entry */}
            {showManualEntry && (
              <div className="bg-slate-800 rounded-xl p-4 space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Check-In Code</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                    className="w-full bg-slate-700 text-white text-center text-2xl font-mono tracking-widest rounded-xl px-4 py-4 placeholder:text-slate-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleCheckIn(manualCode)}
                  disabled={manualCode.length < 6}
                  className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Check In
                </button>
              </div>
            )}

            {/* Recent Shops */}
            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-white font-medium mb-3">Recent Locations</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-slate-700 rounded-xl hover:bg-slate-600 text-left">
                  <div className="w-10 h-10 bg-brand-blue-500/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Classic Cuts Barbershop</p>
                    <p className="text-slate-400 text-sm">Last check-in: Yesterday</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-white font-medium mb-2">How to check in</h3>
              <ol className="text-slate-400 text-sm space-y-2">
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">1.</span>
                  Ask your supervisor to show the shop's QR code
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">2.</span>
                  Scan the code or enter it manually
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">3.</span>
                  Your training time starts automatically
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-blue-400">4.</span>
                  Check out when you leave to log your hours
                </li>
              </ol>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand-blue-500 animate-spin" />
    </div>
  );
}

export default function ApprenticeCheckInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckInContent />
    </Suspense>
  );
}
