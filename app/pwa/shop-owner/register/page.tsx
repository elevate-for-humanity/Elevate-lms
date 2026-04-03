'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, 
  Loader2, AlertCircle, ChevronRight
} from 'lucide-react';

type Step = 'info' | 'details' | 'confirm' | 'success';

interface ShopData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  licenseNumber: string;
  ownerName: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export default function ShopOwnerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [shopData, setShopData] = useState<ShopData>({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    email: '',
    licenseNumber: '',
    ownerName: '',
  });

  const updateField = (field: keyof ShopData, value: string) => {
    setShopData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/partner/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shopData,
          program: 'BARBER',
          type: 'barbershop',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setStep('success');
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Info Step
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <Link href="/pwa/shop-owner" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Become a Partner</h1>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          <div className="bg-white/20 border border-brand-blue-500/30 rounded-xl p-6">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Partner Shop Program</h2>
            <p className="text-white mb-4">
              Join our network of licensed barbershops training the next generation of barbers.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Train apprentices at your shop
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Access to Milady curriculum
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Digital hour tracking & compliance
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Support from Elevate team
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-4">
            <h3 className="text-slate-900 font-semibold mb-3">Requirements</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Valid state barbershop license</li>
              <li>• At least one licensed barber on staff</li>
              <li>• Commitment to apprentice training</li>
              <li>• Compliance with state regulations</li>
            </ul>
          </div>

          <button
            onClick={() => setStep('details')}
            className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 flex items-center justify-center gap-2"
          >
            Start Application
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      </div>
    );
  }

  // Details Step
  if (step === 'details') {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep('info')}
              className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Shop Details</h1>
              <p className="text-slate-500 text-sm">Step 1 of 2</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Shop Name *</label>
              <input
                type="text"
                value={shopData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your Barbershop Name"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Owner Name *</label>
              <input
                type="text"
                value={shopData.ownerName}
                onChange={(e) => updateField('ownerName', e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Street Address *</label>
              <input
                type="text"
                value={shopData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-sm mb-2">City *</label>
                <input
                  type="text"
                  value={shopData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="City"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">State *</label>
                <select
                  value={shopData.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="">Select</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">ZIP Code *</label>
              <input
                type="text"
                value={shopData.zip}
                onChange={(e) => updateField('zip', e.target.value)}
                placeholder="12345"
                maxLength={5}
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Phone *</label>
              <input
                type="tel"
                value={shopData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Email *</label>
              <input
                type="email"
                value={shopData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="shop@elevateforhumanity.org"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Barbershop License # *</label>
              <input
                type="text"
                value={shopData.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                placeholder="License Number"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setStep('confirm')}
            disabled={!shopData.name || !shopData.address || !shopData.city || !shopData.state || !shopData.phone || !shopData.email || !shopData.licenseNumber}
            className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </main>
      </div>
    );
  }

  // Confirmation Step
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setStep('details')}
              className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Confirm Details</h1>
              <p className="text-slate-500 text-sm">Step 2 of 2</p>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 space-y-6">
          {error && (
            <div className="bg-white/10 border border-brand-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 space-y-3">
            <h3 className="text-slate-900 font-semibold">Shop Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Shop Name</span>
                <span className="text-white">{shopData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner</span>
                <span className="text-white">{shopData.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address</span>
                <span className="text-white text-right">
                  {shopData.address}<br />
                  {shopData.city}, {shopData.state} {shopData.zip}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="text-white">{shopData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="text-white">{shopData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License #</span>
                <span className="text-white">{shopData.licenseNumber}</span>
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
              I certify that the information provided is accurate and I agree to the partner program terms and conditions.
            </span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={loading || !agreedToTerms}
            className="w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <span className="text-slate-500 flex-shrink-0">•</span>
                Submit Application
              </>
            )}
          </button>
        </main>
      </div>
    );
  }

  // Success Step
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-slate-500 flex-shrink-0">•</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Application Submitted!</h1>
        <p className="text-slate-500 mb-8">
          Thank you for applying to become a partner shop. Our team will review your application and contact you within 2-3 business days.
        </p>
        <Link
          href="/pwa/shop-owner"
          className="inline-block w-full bg-brand-blue-600 text-white font-bold py-4 rounded-xl hover:bg-brand-blue-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
