'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Mail,
CheckCircle, } from 'lucide-react';



export default function BookAppointmentPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    appointmentType: 'in-person',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/tax/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            service: '',
            appointmentType: 'in-person',
            preferredDate: '',
            preferredTime: '',
            message: '',
          });
          setStatus('idle');
        }, 3000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) { /* Error handled silently */ 
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Book Appointment" }]} />
      </div>
<div className="mb-6">
        <Link
          href="/tax"
          aria-label="Link"
          className="text-sm text-black hover:text-black"
        >
          ← Back to Tax Services
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <h1 className="text-4xl font-bold mb-3">Book Your Appointment</h1>
          <p className="text-lg text-black mb-8">
            Schedule your tax preparation appointment - in-person or virtual.
          </p>

          {status === 'success' ? (
            <div className="rounded-2xl border-2 border-brand-green-200 bg-brand-green-50 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Appointment Request Received!
              </h2>
              <p className="text-black mb-4">
                We'll contact you within 24 hours to confirm your appointment
                time.
              </p>
              <p className="text-sm text-black">
                Check your email for confirmation details.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border bg-white p-8 space-y-6"
            >
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Which service do you need? *
                </label>
                <select
                  required
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({ ...formData, service: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                >
                  <option value="">Select a service...</option>
                  <optgroup label="Free VITA Services">
                    <option value="vita-free-tax-help">
                      Free Tax Help (VITA) - Income under $64,000
                    </option>
                  </optgroup>
                  <optgroup label="Paid Services (SupersonicFastCash)">
                    <option value="individual-tax-prep">
                      Individual Tax Preparation
                    </option>
                    <option value="business-tax-prep">
                      Business Tax Preparation
                    </option>
                    <option value="refund-advance">Tax Refund Advance</option>
                    <option value="amended-return">Amended Return</option>
                    <option value="tax-planning">
                      Tax Planning Consultation
                    </option>
                  </optgroup>
                </select>
              </div>

              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-semibold text-black mb-3">
                  Appointment Type *
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, appointmentType: 'in-person' })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      formData.appointmentType === 'in-person'
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-brand-blue-600" />
                      <span className="font-semibold">In-Person</span>
                    </div>
                    <p className="text-sm text-black">
                      Visit our office at 8888 Keystone Crossing, Suite 1300, Indianapolis
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, appointmentType: 'virtual' })
                    }
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      formData.appointmentType === 'virtual'
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Video className="w-5 h-5 text-brand-blue-600" />
                      <span className="font-semibold">Virtual</span>
                    </div>
                    <p className="text-sm text-black">
                      Meet via Zoom video call from anywhere
                    </p>
                  </button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="(317) 314-3757"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.preferredDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Preferred Time *
                  </label>
                  <select
                    required
                    value={formData.preferredTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="">Select time...</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="Any specific questions or concerns?"
                />
              </div>

              {status === 'error' && (
                <div className="rounded-lg bg-brand-red-50 border border-brand-red-200 p-4">
                  <p className="text-brand-red-800 text-sm">
                    Something went wrong. Please try again or contact us at
                    support center.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-brand-blue-600 text-white font-bold text-lg rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Submitting...' : 'Request Appointment'}
              </button>

              <p className="text-xs text-black text-center">
                By submitting, you agree to be contacted about your appointment.
                We'll confirm your appointment within 24 hours.
              </p>
            </form>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="font-bold text-lg mb-4">Contact Us</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Phone</div>
                  <a
                    href="/support"
                    className="text-brand-blue-600 hover:underline"
                  >
                    support center
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Email</div>
                  <a
                    href="/contact"
                    className="text-brand-blue-600 hover:underline text-sm"
                  >
                    our contact form
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Address</div>
                  <p className="text-sm text-black">
                    8888 Keystone Crossing, Suite 1300
                    <br />
                    Indianapolis, IN 46240
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="font-bold text-lg mb-4">Office Hours</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black">Monday - Friday:</span>
                <span className="font-semibold">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Saturday:</span>
                <span className="font-semibold">10:00 AM - 2:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Sunday:</span>
                <span className="font-semibold">Closed</span>
              </div>
            </div>
            <p className="text-xs text-black mt-4">
              Extended hours available during tax season (Jan - Apr)
            </p>
          </div>

          {/* Virtual Appointment Info */}
          <div className="rounded-2xl border-2 border-brand-blue-200 bg-brand-blue-50 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-5 h-5 text-brand-blue-600" />
              <h2 className="font-bold text-lg">Virtual Appointments</h2>
            </div>
            <p className="text-sm text-black mb-3">
              Can't make it to our office? No problem! We offer secure video
              appointments via Zoom.
            </p>
            <ul className="space-y-2 text-sm text-black">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Same service as in-person</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>Secure document sharing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span>No software installation needed</span>
              </li>
            </ul>
          </div>

          {/* What to Bring */}
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="font-bold text-lg mb-4">What to Bring</h2>
            <ul className="space-y-2 text-sm text-black">
              <li>• Photo ID</li>
              <li>• Social Security cards</li>
              <li>• W-2s and 1099s</li>
              <li>• Last year's tax return</li>
              <li>• Bank account info</li>
            </ul>
            <Link
              href="/tax/rise-up-foundation/documents"
              className="text-brand-blue-600 hover:underline text-sm mt-3 inline-block"
            >
              View complete checklist →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
