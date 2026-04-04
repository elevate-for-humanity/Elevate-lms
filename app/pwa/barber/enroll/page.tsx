'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Scissors, MapPin, Building2, 
  Loader2, AlertCircle, ChevronRight
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
}

type Step = 'info' | 'shop' | 'confirm' | 'success';

export default function BarberEnrollPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  
  // Form data
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (step === 'shop') {
      fetchPartners();
    }
  }, [step]);

  const fetchPartners = async () => {
    setLoadingPartners(true);
    try {
      const response = await fetch('/api/partners?program=barber&status=active');
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoadingPartners(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedPartner || !agreedToTerms) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enrollment/barber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPartner.id,
          programId: 'BARBER',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Enrollment failed');
      }

      setStep('success');
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Info Step
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <Link href="/pwa/barber" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <h1 className="text-xl font-bold text-white">Enroll as Apprentice</h1>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          <div className="bg-slate-700 border border-brand-blue-500/30 rounded-xl p-6">
            <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Barber Apprenticeship</h2>
            <p className="text-blue-200 mb-4">
              Train at a licensed barbershop while earning hours toward your state license.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                2,000 hours of hands-on training
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Elevate LMS curriculum included
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                State board exam preparation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Earn while you learn
              </li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Requirements</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Must be at least 16 years old</li>
              <li>• High school diploma or GED (or currently enrolled)</li>
              <li>• Commitment to complete 2,000 hours</li>
              <li>• Assigned to a licensed partner barbershop</li>
            </ul>
          </div>

          <button
            onClick={() => setStep('shop')}
            className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      </div>
    );
  }

  // Shop Selection Step
  if (step === 'shop') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep('info')}
              className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Select a Shop</h1>
              <p className="text-slate-500 text-sm">Choose where you'll train</p>
            </div>
          </div>
        </header>

        <div className="px-4 py-4">
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        <main className="px-4 pb-6 space-y-3">
          {loadingPartners ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-brand-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-slate-500">Loading partner shops...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No partner shops found</p>
              <p className="text-slate-500 text-sm mt-1">Try a different search or check back later</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <button
                key={partner.id}
                onClick={() => {
                  setSelectedPartner(partner);
                  setStep('confirm');
                }}
                className={`w-full text-left bg-slate-800 rounded-xl p-4 border-2 transition-colors ${
                  selectedPartner?.id === partner.id 
                    ? 'border-brand-blue-500' 
                    : 'border-transparent hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-brand-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{partner.name}</p>
                    <p className="text-slate-500 text-sm flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {partner.city}, {partner.state}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </button>
            ))
          )}
        </main>
      </div>
    );
  }

  // Confirmation Step
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep('shop')}
              className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Confirm Enrollment</h1>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          {error && (
            <div className="bg-white/10 border border-brand-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-sm mb-3">Training Location</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                <Scissors className="w-6 h-6 text-brand-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">{selectedPartner?.name}</p>
                <p className="text-slate-500 text-sm">
                  {selectedPartner?.city}, {selectedPartner?.state}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-sm mb-3">Program Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Program</span>
                <span className="text-white">Barber Apprenticeship</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Required Hours</span>
                <span className="text-white">2,000 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Curriculum</span>
                <span className="text-white">Elevate LMS Standard</span>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 bg-slate-800 rounded-xl p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-slate-600 bg-slate-700 text-brand-blue-600 focus:ring-brand-blue-500"
            />
            <span className="text-slate-600 text-sm">
              I agree to the apprenticeship terms and conditions, and understand that I must complete 2,000 hours of training to be eligible for state licensure.
            </span>
          </label>

          <button
            onClick={handleEnroll}
            disabled={loading || !agreedToTerms}
            className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <span className="text-slate-500 flex-shrink-0">•</span>
                Confirm Enrollment
              </>
            )}
          </button>
        </main>
      </div>
    );
  }

  // Success Step
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-slate-500 flex-shrink-0">•</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Enrollment Complete!</h1>
        <p className="text-slate-500 mb-8">
          Welcome to the Barber Apprenticeship program. You can now start logging your training hours.
        </p>
        <Link
          href="/pwa/barber"
          className="inline-block w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
