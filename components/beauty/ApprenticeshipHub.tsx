'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, ExternalLink, Scissors, Sparkles, Droplet, Flower2 } from 'lucide-react';

/**
 * Verified Host Shops - Single Source of Truth
 */
const HOST_SHOPS = [
  { id: '1', name: 'Elevate Barber Studio', address: 'Indianapolis, IN', phone: '(317) 314-3757' },
  { id: '2', name: 'Main Street Stylists', address: 'Carmel, IN', phone: '(317) 555-0123' }
];

export default function ApprenticeshipHub() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Apprenticeship Hub</h1>
      <p className="text-lg text-slate-600 mb-12">
        Find verified host shops and start your career journey today.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {HOST_SHOPS.length > 0 ? (
          HOST_SHOPS.map((shop) => (
            <div key={shop.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold mb-2">{shop.name}</h3>
              <p className="text-slate-600 mb-4">{shop.address}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">No host shops available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
