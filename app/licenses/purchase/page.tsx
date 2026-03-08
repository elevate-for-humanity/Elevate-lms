'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { loadStripe } from '@stripe/stripe-js';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');



export default function PurchaseLicensePage() {
  const [selectedLicense, setSelectedLicense] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);

  const licenses = [
    {
      id: 'cna',
      name: 'CNA License',
      description: 'Certified Nursing Assistant Program License',
      price: 1500,
      duration: '6 weeks',
      image: '/images/pages/program-holder-page-1.jpg',
    },
    {
      id: 'barber',
      name: 'Barber License',
      description: 'Professional Barber Apprenticeship License',
      price: 2000,
      duration: '12 months',
      image: '/images/pages/program-holder-page-1.jpg',
    },
    {
      id: 'hvac',
      name: 'HVAC License',
      description: 'HVAC Technician Certification License',
      price: 2500,
      duration: '8 weeks',
      image: '/images/pages/program-holder-page-1.jpg',
    },
  ];

  const handlePurchase = async () => {
    if (!selectedLicense) {
      alert('Please select a license');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId: selectedLicense,
          quantity,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      alert('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  const selectedLicenseData = licenses.find(l => l.id === selectedLicense);
  const total = selectedLicenseData ? selectedLicenseData.price * quantity : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Breadcrumbs
        items={[
          { label: 'Licenses', href: '/licenses' },
          { label: 'Purchase' },
        ]}
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Purchase Program License</h1>
        <p className="text-black mb-8">
          Select a program license to offer training to your students
        </p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Available Licenses</h2>
              
              <div className="space-y-4">
                {licenses.map((license) => (
                  <div
                    key={license.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLicense === license.id
                        ? 'border-brand-orange-600 bg-brand-orange-50'
                        : 'border-gray-200 hover:border-brand-orange-300'
                    }`}
                    onClick={() => setSelectedLicense(license.id)}
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={license.image}
                          alt={license.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {license.name}
                        </h3>
                        <p className="text-sm text-black mb-2">
                          {license.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-brand-orange-600 font-semibold">
                            ${license.price.toLocaleString()}
                          </span>
                          <span className="text-black">
                            Duration: {license.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">What's Included</h3>
              <ul className="space-y-2 text-black">
                <li>• Full curriculum access</li>
                <li>• Student enrollment management</li>
                <li>• Progress tracking and reporting</li>
                <li>• Certificate generation</li>
                <li>• Compliance documentation</li>
                <li>• Ongoing support</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              {selectedLicenseData ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-black">License</p>
                      <p className="font-semibold">{selectedLicenseData.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm text-black mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-black">Subtotal</span>
                        <span>${total.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-brand-orange-600">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Purchase License'}
                  </Button>
                </>
              ) : (
                <p className="text-black text-center py-8">
                  Select a license to continue
                </p>
              )}

              <p className="text-xs text-black text-center mt-4">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
