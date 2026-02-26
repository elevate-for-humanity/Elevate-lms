'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


import { logger } from '@/lib/logger';
import React from 'react';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Video,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// Calendly widget script
const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_LINK = 'https://calendly.com/elevateforhumanity/paid-tax-services';



export default function BookAppointment() {
  const [step, setStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState({
    serviceType: '',
    appointmentType: '',
    date: '',
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    taxSituation: '',
    hasW2: false,
    has1099: false,
    hasBusinessIncome: false,
    hasRentalIncome: false,
    needsRefundAdvance: false,
    refundAdvanceAmount: '',
    location: '',
  });

  const serviceTypes = [
    {
      id: 'basic',
      name: 'Basic Tax Filing',
      price: 'Request a Quote',
      description: 'W-2 income only, standard deduction',
      duration: '30 minutes',
    },
    {
      id: 'deluxe',
      name: 'Deluxe Tax Filing',
      price: 'Request a Quote',
      description: 'Multiple income sources, itemized deductions',
      duration: '45 minutes',
    },
    {
      id: 'premium',
      name: 'Premium Tax Filing',
      price: 'Request a Quote',
      description: 'Business income, rental property, investments',
      duration: '60 minutes',
    },
    {
      id: 'refund-advance',
      name: 'Tax Refund Advance',
      price: 'Request a Quote',
      description: 'Get $250-$7,500 same day + tax filing',
      duration: '45 minutes',
    },
  ];

  const appointmentTypes = [
    {
      id: 'video',
      name: 'Video Call (Online)',
      icon: Video,
      description:
        'Meet with tax pro via secure video call from anywhere in Indiana',
    },
    {
      id: 'phone',
      name: 'Phone Call',
      icon: Phone,
      description: 'Speak with tax pro by phone, upload documents online',
    },
    {
      id: 'in-person',
      name: 'In-Person (By Appointment)',
      icon: MapPin,
      description: 'Visit our Indianapolis office - appointment required',
    },
  ];

  const availableDates = [
    '2025-01-20',
    '2025-01-21',
    '2025-01-22',
    '2025-01-23',
    '2025-01-24',
    '2025-01-27',
    '2025-01-28',
    '2025-01-29',
    '2025-01-30',
    '2025-01-31',
  ];

  const timeSlots = [
    '09:00 AM',
    '09:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '01:00 PM',
    '01:30 PM',
    '02:00 PM',
    '02:30 PM',
    '03:00 PM',
    '03:30 PM',
    '04:00 PM',
    '04:30 PM',
  ];

  const locations = [
    {
      id: 'meridian',
      name: '8888 Keystone Xing, Suite 1300, Indianapolis, IN 46240',
      available: appointmentData.appointmentType === 'in-person',
    },
    {
      id: '56th',
      name: '7009 E 56th St, Suite EE1, Indianapolis, IN 46226',
      available: appointmentData.appointmentType === 'in-person',
    },
  ];

  // Load Calendly widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCalendly = () => {
    if (typeof window !== 'undefined' && (window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({
        url: CALENDLY_LINK,
        prefill: {
          name: `${appointmentData.firstName} ${appointmentData.lastName}`,
          email: appointmentData.email,
          customAnswers: {
            a1: appointmentData.phone,
            a2: appointmentData.serviceType,
          }
        }
      });
    }
  };

  const handlePayment = async () => {
    try {
      const selectedService = serviceTypes.find(
        (s) => s.id === appointmentData.serviceType
      );

      const response = await fetch('/api/tax/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentData,
          servicePrice: selectedService?.price || 0,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) { /* Error handled silently */ 
      logger.error('Booking error:', error);
      alert('Booking failed. Please call 317-314-3757 for assistance.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Book Appointment" }]} />
      </div>
<div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Book Your Tax Appointment</h1>
          <p className="text-xl text-black mb-6">
            Schedule online, video, or phone consultation with PTIN-credentialed tax
            pro
          </p>
          
          {/* Quick Calendly Button */}
          <div className="flex justify-center gap-4">
            <button
              onClick={openCalendly}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Schedule with Calendly (Recommended)
            </button>
            <button
              onClick={() => setStep(1)}
              className="bg-gray-200 hover:bg-gray-300 text-black px-8 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Manual Booking
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-brand-green-600 text-white'
                      : 'bg-gray-300 text-black'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 flex-1 ${
                      step > s ? 'bg-brand-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span>Service</span>
            <span>Type</span>
            <span>Schedule</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Select Your Service</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setAppointmentData({
                      ...appointmentData,
                      serviceType: service.id,
                    });
                    setStep(2);
                  }}
                  className={`text-left p-6 rounded-lg border-2 transition ${
                    appointmentData.serviceType === service.id
                      ? 'border-brand-green-600 bg-brand-green-50'
                      : 'border-gray-300 hover:border-brand-green-400'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold">{service.name}</h3>
                    <span className="text-2xl font-bold text-brand-green-600">
                      ${service.price}
                    </span>
                  </div>
                  <p className="text-black mb-2">{service.description}</p>
                  <p className="text-sm text-black">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {service.duration}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Appointment Type */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">
              How Would You Like to Meet?
            </h2>
            <div className="space-y-4">
              {appointmentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setAppointmentData({
                        ...appointmentData,
                        appointmentType: type.id,
                      });
                    }}
                    className={`w-full text-left p-6 rounded-lg border-2 transition ${
                      appointmentData.appointmentType === type.id
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-gray-300 hover:border-brand-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Icon className="w-8 h-8 text-brand-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="text-xl font-bold mb-2">{type.name}</h3>
                        <p className="text-black">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {appointmentData.appointmentType === 'video' && (
              <div className="mt-6 bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
                <h4 className="font-bold mb-2">Video Call Requirements:</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• Computer, tablet, or smartphone with camera</li>
                  <li>• Stable internet connection</li>
                  <li>• Zoom app (we'll send link before appointment)</li>
                  <li>• Have tax documents ready to share screen</li>
                </ul>
              </div>
            )}

            {appointmentData.appointmentType === 'in-person' && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-bold mb-2">
                  <AlertTriangle className="w-5 h-5 inline-block" /> In-Person
                  Appointments:
                </h4>
                <p className="text-sm text-black mb-3">
                  Walk-ins are NOT available. You must book an appointment
                  online first.
                </p>
                <h4 className="font-bold mb-2">Select Location:</h4>
                <div className="space-y-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() =>
                        setAppointmentData({
                          ...appointmentData,
                          location: loc.id,
                        })
                      }
                      className={`w-full text-left p-4 rounded border-2 ${
                        appointmentData.location === loc.id
                          ? 'border-brand-green-600 bg-brand-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!appointmentData.appointmentType}
                className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Select Date & Time</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-4">Available Dates</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() =>
                        setAppointmentData({
                          ...appointmentData,
                          date,
                          time: '',
                        })
                      }
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 font-semibold ${
                        appointmentData.date === date
                          ? 'border-brand-blue-600 bg-brand-blue-50'
                          : 'border-gray-300 hover:border-brand-blue-400'
                      }`}
                    >
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Available Times</h3>
                {!appointmentData.date && (
                  <p className="text-black italic">Select a date first</p>
                )}
                {appointmentData.date && (
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() =>
                          setAppointmentData({ ...appointmentData, time })
                        }
                        className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm ${
                          appointmentData.time === time
                            ? 'border-brand-green-600 bg-brand-green-50'
                            : 'border-gray-300 hover:border-brand-green-400'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {appointmentData.date && appointmentData.time && (
              <div className="mt-6 bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                <p className="font-bold text-brand-green-900">
                  Selected:{' '}
                  {new Date(appointmentData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  at {appointmentData.time}
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!appointmentData.date || !appointmentData.time}
                className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Contact Info & Payment */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Your Information</h2>

            <div className="space-y-4 mb-8">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={appointmentData.firstName}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={appointmentData.lastName}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border rounded-lg"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  value={appointmentData.email}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="you@example.com"
                />
                <p className="text-sm text-black mt-1">
                  We'll send appointment confirmation and{' '}
                  {appointmentData.appointmentType === 'video'
                    ? 'Zoom link'
                    : 'details'}{' '}
                  to this email
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2">Phone *</label>
                <input
                  type="tel"
                  value={appointmentData.phone}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Get Help Online"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Brief Description of Tax Situation
                </label>
                <textarea
                  value={appointmentData.taxSituation}
                  onChange={(e) =>
                    setAppointmentData({
                      ...appointmentData,
                      taxSituation: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="e.g., W-2 employee, need help with deductions, etc."
                />
              </div>

              <div>
                <label className="block font-semibold mb-3">
                  Income Sources (check all that apply)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={appointmentData.hasW2}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          hasW2: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>W-2 (Employee wages)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={appointmentData.has1099}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          has1099: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>1099 (Self-employed/Contractor)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={appointmentData.hasBusinessIncome}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          hasBusinessIncome: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>Business Income</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={appointmentData.hasRentalIncome}
                      onChange={(e) =>
                        setAppointmentData({
                          ...appointmentData,
                          hasRentalIncome: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span>Rental Property Income</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={appointmentData.needsRefundAdvance}
                    onChange={(e) =>
                      setAppointmentData({
                        ...appointmentData,
                        needsRefundAdvance: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">
                    I'm interested in a Tax Refund Advance ($250-$7,500)
                  </span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-bold text-lg mb-4">Appointment Summary</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Service:</strong>{' '}
                  {
                    serviceTypes.find(
                      (s) => s.id === appointmentData.serviceType
                    )?.name
                  }
                </p>
                <p>
                  <strong>Type:</strong>{' '}
                  {
                    appointmentTypes.find(
                      (t) => t.id === appointmentData.appointmentType
                    )?.name
                  }
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(appointmentData.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p>
                  <strong>Time:</strong> {appointmentData.time}
                </p>
                {appointmentData.location && (
                  <p>
                    <strong>Location:</strong>{' '}
                    {
                      locations.find((l) => l.id === appointmentData.location)
                        ?.name
                    }
                  </p>
                )}
                <p className="text-2xl font-bold text-brand-green-600 mt-4">
                  Total: $
                  {
                    serviceTypes.find(
                      (s) => s.id === appointmentData.serviceType
                    )?.price
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-300 text-black py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={
                  !appointmentData.firstName ||
                  !appointmentData.lastName ||
                  !appointmentData.email ||
                  !appointmentData.phone
                }
                className="flex-1 bg-brand-green-600 text-white py-4 rounded-lg font-bold hover:bg-brand-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Pay & Book Appointment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
