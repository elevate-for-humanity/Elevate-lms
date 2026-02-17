"use client";

import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Mail,
  Phone,
  Building,
  User,
  Briefcase,
  MessageSquare,
  Send,
  TrendingUp,
CheckCircle, } from 'lucide-react';



export default function FSSAPartnershipRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    title: '',
    email: '',
    phone: '',
    partnershipType: '',
    programsInterest: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fssa-partnership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-900   py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">
              Thank You for Your Interest!
            </h1>
            <p className="text-lg text-black mb-6">
              We've received your FSSA/SNAP E&T partnership request.
            </p>
            <div className="bg-brand-blue-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold text-black mb-3">
                What Happens Next:
              </h3>
              <ul className="space-y-2 text-black">
                <li className="flex items-start">
                  <span className="text-brand-blue-600 mr-2">1.</span>
                  Our partnerships team will review your request
                </li>
                <li className="flex items-start">
                  <span className="text-brand-blue-600 mr-2">2.</span>
                  We'll contact you within 1-2 business days
                </li>
                <li className="flex items-start">
                  <span className="text-brand-blue-600 mr-2">3.</span>
                  We'll schedule a discovery call to discuss your needs
                </li>
                <li className="flex items-start">
                  <span className="text-brand-blue-600 mr-2">4.</span>
                  We'll provide detailed SNAP E&T capability information
                </li>
              </ul>
            </div>
            <div className="border-t pt-6">
              <p className="text-black mb-4">
                <strong>Contact Us Directly:</strong>
              </p>
              <p className="text-black">
                <Phone className="inline w-4 h-4 mr-2" />
                317-314-3757
              </p>
              <p className="text-black">
                <Mail className="inline w-4 h-4 mr-2" />
                info@elevateforhumanity.org
              </p>
            </div>
            <div className="mt-8 space-x-4">
              <Link
                href="/snap-et-partner"
                className="inline-block px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
              >
                Back to SNAP E&T Info
              </Link>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Breadcrumbs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'FSSA Partnership Request' }]} />
        </div>
      </div>

      <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            FSSA/SNAP E&T Partnership Request
          </h1>
          <p className="text-xl text-black max-w-2xl mx-auto">
            Partner with Elevate for Humanity to provide workforce training for
            SNAP recipients
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h3 className="font-bold text-black mb-2">ETPL Approved</h3>
            <p className="text-sm text-black">
              Indiana DWD approved training provider
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Building className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-black mb-2">DOL Registered</h3>
            <p className="text-sm text-black">
              Registered Apprenticeship Sponsor
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-black mb-2">80-Hour Tracking</h3>
            <p className="text-sm text-black">
              Automated compliance reporting
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">
                Contact Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <Building className="inline w-4 h-4 mr-1" />
                    Organization *
                  </label>
                  <input
                    type="text"
                    name="organization"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Indiana FSSA, WorkOne, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Title/Position
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="SNAP E&T Coordinator"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="john.smith@fssa.in.gov"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="(317) 314-3757"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Partnership Type *
                  </label>
                  <select
                    name="partnershipType"
                    required
                    value={formData.partnershipType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    <option value="fssa">Indiana FSSA</option>
                    <option value="workone">WorkOne</option>
                    <option value="dwd">Indiana DWD</option>
                    <option value="workforce_board">Workforce Board</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Partnership Details */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">
                Partnership Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Programs of Interest
                  </label>
                  <input
                    type="text"
                    name="programsInterest"
                    value={formData.programsInterest}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="CNA, HVAC, Barber, CDL, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    <MessageSquare className="inline w-4 h-4 mr-1" />
                    Message / Additional Information
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    placeholder="Tell us about your SNAP E&T needs, number of participants, timeline, etc."
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Link
                href="/snap-et-partner"
                className="text-black hover:text-black font-semibold"
              >
                ← Back to SNAP E&T Info
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Partnership Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-black">
          <p className="mb-2">
            <strong>Prefer to call?</strong> Contact us directly:
          </p>
          <p className="text-lg font-semibold text-black">
            317-314-3757 | info@elevateforhumanity.org
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
