'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import React from 'react';

import { useState } from 'react';
import { Calendar, CreditCard, Award } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);



export default function IPLAExamSignup() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    email: '',
    phone: '',
    apprenticeshipProgram: '',
  });
  const [loading, setLoading] = useState(false);

  const availableDates = [
    '2025-01-15',
    '2025-01-22',
    '2025-01-29',
    '2025-02-05',
    '2025-02-12',
    '2025-02-19',
    '2025-02-26',
  ];

  const availableTimes = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
  ];

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/apprenticeships/ipla-exam/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentInfo,
          examDate: selectedDate,
          examTime: selectedTime,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) { /* Error handled silently */ 
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[280px] max-h-[400px]">
        <Image
          src="/images/programs-hq/barber-hero.jpg"
          alt="Barber apprentice preparing for licensing exam"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-slate-900/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-10 h-10 text-white" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">IPLA Apprenticeship Exam</h1>
                <p className="text-white/80">Indiana Professional Licensing Agency</p>
              </div>
            </div>
            <p className="text-lg text-white/90 max-w-2xl">
              Schedule your apprenticeship licensing exam. Required for barber, cosmetology, and esthetics apprenticeships.
            </p>
          </div>
        </div>
      </section>

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Apprenticeships", href: "/apprenticeships" }, { label: "IPLA Exam" }]} />
        </div>
        <div className="max-w-4xl mx-auto px-6">

        {/* Exam Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Exam Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-brand-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">What's Included</h3>
              <ul className="space-y-2 text-black">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>State licensing exam fee</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Testing center access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Official score report</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span>Certificate upon passing</span>
                </li>
              </ul>
            </div>
            <div className="bg-brand-green-50 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-3">Exam Details</h3>
              <ul className="space-y-2 text-black">
                <li>
                  <strong>Duration:</strong> 2 hours
                </li>
                <li>
                  <strong>Format:</strong> Computer-based (PSI)
                </li>
                <li>
                  <strong>Location:</strong> PSI Testing Center, Indianapolis
                </li>
                <li>
                  <strong>IPLA Application Fee:</strong> $40
                </li>
                <li>
                  <strong>PSI Exam Fee:</strong> $65
                </li>
                <li>
                  <strong>Total Cost:</strong> $105
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Student Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                value={studentInfo.name}
                onChange={(e) =>
                  setStudentInfo({ ...studentInfo, name: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Email *</label>
              <input
                type="email"
                value={studentInfo.email}
                onChange={(e) =>
                  setStudentInfo({ ...studentInfo, email: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Phone *</label>
              <input
                type="tel"
                value={studentInfo.phone}
                onChange={(e) =>
                  setStudentInfo({ ...studentInfo, phone: e.target.value })
                }
                className="w-full px-4 py-3 border rounded-lg"
                placeholder="(317) 314-3757"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">
                Apprenticeship Program *
              </label>
              <select
                value={studentInfo.apprenticeshipProgram}
                onChange={(e) =>
                  setStudentInfo({
                    ...studentInfo,
                    apprenticeshipProgram: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="">Select program...</option>
                <option value="barber">Barber Apprenticeship</option>
                <option value="cosmetology">Cosmetology Apprenticeship</option>
                <option value="esthetics">Esthetics Apprenticeship</option>
                <option value="nail-tech">
                  Nail Technician Apprenticeship
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Select Exam Date & Time
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-3">
                Available Dates
              </label>
              <div className="space-y-2">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left font-semibold transition ${
                      selectedDate === date
                        ? 'border-brand-blue-600 bg-brand-blue-50 text-brand-blue-900'
                        : 'border-gray-300 hover:border-brand-blue-400'
                    }`}
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-3">
                Available Times
              </label>
              <div className="space-y-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    disabled={!selectedDate}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left font-semibold transition ${
                      selectedTime === time
                        ? 'border-brand-green-600 bg-brand-green-50 text-brand-green-900'
                        : 'border-gray-300 hover:border-brand-green-400 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Payment
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-base">IPLA Application Fee</span>
                <span className="text-lg font-semibold">$40.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-base">PSI Written Exam Fee</span>
                <span className="text-lg font-semibold">$65.00</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold">$105.00</span>
              </div>
            </div>
            <p className="text-sm text-black">
              Secure payment processed by Stripe. You will receive a
              confirmation email after payment.
            </p>
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-brand-blue-900">
                Selected: {new Date(selectedDate).toLocaleDateString()} at{' '}
                {selectedTime}
              </p>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={
              !studentInfo.name ||
              !studentInfo.email ||
              !studentInfo.phone ||
              !studentInfo.apprenticeshipProgram ||
              !selectedDate ||
              !selectedTime ||
              loading
            }
            className="w-full bg-brand-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Processing...' : 'Pay $105 & Schedule Exam'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
