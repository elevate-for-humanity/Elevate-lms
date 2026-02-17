'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, MapPin, Phone, Mail, 
  FileText, Save, Loader2, AlertCircle
} from 'lucide-react';

interface ShopDetails {
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

export default function ShopDetailsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [shop, setShop] = useState<ShopDetails>({
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

  useEffect(() => {
    async function fetchShopDetails() {
      try {
        const response = await fetch('/api/shop/details');
        if (response.ok) {
          const data = await response.json();
          setShop(data);
        }
      } catch (err) {
        console.error('Failed to fetch shop details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShopDetails();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/shop/details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shop),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pwa/shop-owner/settings" className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Shop Details</h1>
              <p className="text-slate-400 text-sm">Edit your shop information</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {error && (
          <div className="bg-brand-red-500/10 border border-brand-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-brand-red-200 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-brand-green-500/10 border border-brand-green-500/30 rounded-xl p-4 flex items-start gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <p className="text-brand-green-200 text-sm">Changes saved successfully</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3 text-slate-400 text-sm mb-2">
            <Building2 className="w-4 h-4" />
            Basic Information
          </div>
          
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Shop Name</label>
            <input
              type="text"
              value={shop.name}
              onChange={(e) => setShop(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Owner Name</label>
            <input
              type="text"
              value={shop.ownerName}
              onChange={(e) => setShop(prev => ({ ...prev, ownerName: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">License Number</label>
            <input
              type="text"
              value={shop.licenseNumber}
              onChange={(e) => setShop(prev => ({ ...prev, licenseNumber: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3 text-slate-400 text-sm mb-2">
            <MapPin className="w-4 h-4" />
            Address
          </div>
          
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Street Address</label>
            <input
              type="text"
              value={shop.address}
              onChange={(e) => setShop(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-sm mb-1 block">City</label>
              <input
                type="text"
                value={shop.city}
                onChange={(e) => setShop(prev => ({ ...prev, city: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1 block">State</label>
              <select
                value={shop.state}
                onChange={(e) => setShop(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="">Select</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">ZIP Code</label>
            <input
              type="text"
              value={shop.zip}
              onChange={(e) => setShop(prev => ({ ...prev, zip: e.target.value }))}
              maxLength={10}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3 text-slate-400 text-sm mb-2">
            <Phone className="w-4 h-4" />
            Contact Information
          </div>
          
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Phone Number</label>
            <input
              type="tel"
              value={shop.phone}
              onChange={(e) => setShop(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 555-5555"
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 text-sm mb-1 block">Email Address</label>
            <input
              type="email"
              value={shop.email}
              onChange={(e) => setShop(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        {/* QR Code Link */}
        <Link
          href="/pwa/shop-owner/checkin"
          className="flex items-center gap-4 bg-brand-blue-600/20 border border-brand-blue-500/30 rounded-xl p-4"
        >
          <div className="w-12 h-12 bg-brand-blue-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">Check-In QR Code</p>
            <p className="text-brand-blue-300 text-sm">View and share your shop's check-in code</p>
          </div>
        </Link>
      </main>
    </div>
  );
}
