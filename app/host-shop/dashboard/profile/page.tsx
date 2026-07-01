'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  Shield,
  Check,
} from 'lucide-react';

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);
  
  const shopData = {
    businessName: 'Elevate Barbershop',
    dbaName: 'Elevate Barber & Beauty',
    licenseNumber: 'IN-BB-123456',
    licenseExpiry: '2027-03-15',
    ownerName: 'John Smith',
    ownerEmail: 'john@elevatebarbershop.com',
    ownerPhone: '(317) 555-0123',
    addressLine1: '123 Main Street',
    addressLine2: 'Suite 100',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46201',
    supervisorName: 'Jane Doe',
    supervisorLicense: 'IN-SUP-789012',
    programsHosted: ['barber', 'cosmetology'],
    capacity: { barber: 5, cosmetology: 3, nail_tech: 2, esthetics: 2 },
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Shop Profile</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition ${
                saved 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Shop Profile</h1>
          <p className="text-slate-500">Manage your business information and settings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-blue-600" />
                Business Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    defaultValue={shopData.businessName}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">DBA Name</label>
                  <input
                    type="text"
                    defaultValue={shopData.dbaName}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                  <input
                    type="text"
                    defaultValue={shopData.licenseNumber}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Expiry</label>
                  <input
                    type="date"
                    defaultValue={shopData.licenseExpiry}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-brand-blue-600" />
                Contact Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    defaultValue={shopData.ownerName}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={shopData.ownerEmail}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    defaultValue={shopData.ownerPhone}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-blue-600" />
                Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    defaultValue={shopData.addressLine1}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suite/Unit</label>
                  <input
                    type="text"
                    defaultValue={shopData.addressLine2}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      defaultValue={shopData.city}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      defaultValue={shopData.state}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      defaultValue={shopData.zipCode}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-blue-600" />
                Supervisor Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor Name</label>
                  <input
                    type="text"
                    defaultValue={shopData.supervisorName}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor License</label>
                  <input
                    type="text"
                    defaultValue={shopData.supervisorLicense}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shop Logo */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Shop Logo</h3>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Building2 className="w-16 h-16 text-slate-300" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
              </div>
            </div>

            {/* Programs Hosted */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Programs Hosted</h3>
              <div className="space-y-3">
                {['barber', 'cosmetology', 'nail_tech', 'esthetics'].map(program => (
                  <label key={program} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      defaultChecked={shopData.programsHosted.includes(program)}
                      className="w-5 h-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                    />
                    <span className="text-sm text-slate-700 capitalize">{program.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Capacity by Program</h3>
              <div className="space-y-3">
                {Object.entries(shopData.capacity).map(([program, capacity]) => (
                  <div key={program} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">{program.replace('_', ' ')}</span>
                    <input
                      type="number"
                      defaultValue={capacity}
                      min="0"
                      className="w-20 px-3 py-1 border border-slate-200 rounded-lg text-sm text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
