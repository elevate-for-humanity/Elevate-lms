"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ApprenticeshipBadge } from '@/components/programs/ApprenticeshipBadge';
import { ComplianceNotice } from '@/components/compliance/ComplianceNotice';
import { getPoliciesForFeature } from '@/lib/policies';
import { ApprenticeshipShopFields } from '@/components/forms/ApprenticeshipShopFields';
import Turnstile from '@/components/Turnstile';

const APPRENTICESHIP_PROGRAMS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'nail-technician-apprenticeship',
];

export default function ApplyFormClient() {
  const [programParam, setProgramParam] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: '',
    message: '',
    state_code: 'IN',
  });

  const [shopData, setShopData] = useState<ShopFormData>({
    trainingRegion: 'indiana',
    trainingRegionOther: '',
    programTrack: '',
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    ownerManagerName: '',
    supervisorName: '',
    supervisorLicenseType: '',
    shopAcknowledgment: false,
    regionAcknowledgment: false,
  });

  const [shopErrors, setShopErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  const isApprenticeshipProgram = APPRENTICESHIP_PROGRAMS.includes(formData.program);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const program = params.get('program');
    if (program) {
      setProgramParam(program);
      setFormData((prev) => ({ ...prev, program }));
      // Set program track based on program
      if (program.includes('barber')) {
        setShopData((prev) => ({ ...prev, programTrack: 'barber' }));
      } else if (program.includes('cosmetology')) {
        setShopData((prev) => ({ ...prev, programTrack: 'cosmetology' }));
      } else if (program.includes('esthetician')) {
        setShopData((prev) => ({ ...prev, programTrack: 'esthetician' }));
      } else if (program.includes('nail')) {
        setShopData((prev) => ({ ...prev, programTrack: 'nail-technician' }));
      }
    }
  }, []);

  const validateShopData = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!shopData.trainingRegion) {
      errors.trainingRegion = 'Training region is required';
    }
    if (shopData.trainingRegion === 'other' && !shopData.trainingRegionOther.trim()) {
      errors.trainingRegionOther = 'Please specify your state/region';
    }
    if (!shopData.programTrack) {
      errors.programTrack = 'Program track is required';
    }
    if (!shopData.shopName.trim()) {
      errors.shopName = 'Shop name is required';
    }
    if (!shopData.shopAddress.trim()) {
      errors.shopAddress = 'Shop address is required';
    }
    if (!shopData.shopPhone.trim()) {
      errors.shopPhone = 'Shop phone is required';
    }
    if (!shopData.ownerManagerName.trim()) {
      errors.ownerManagerName = 'Owner/manager name is required';
    }
    if (!shopData.supervisorName.trim()) {
      errors.supervisorName = 'Supervisor name is required';
    }
    if (!shopData.supervisorLicenseType) {
      errors.supervisorLicenseType = 'Supervisor license type is required';
    }
    if (!shopData.regionAcknowledgment) {
      errors.regionAcknowledgment = 'You must acknowledge the region requirements';
    }
    if (!shopData.shopAcknowledgment) {
      errors.shopAcknowledgment = 'You must acknowledge the shop requirements';
    }

    setShopErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate shop data for apprenticeship programs
    if (isApprenticeshipProgram && !validateShopData()) {
      // Scroll to first error
      const firstError = document.querySelector('[class*="border-red"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setStatus('loading');

    try {
      // Send inquiry via API
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          message: formData.message,
          state_code: formData.state_code,
          // Include shop data for apprenticeship programs
          ...(isApprenticeshipProgram && {
            training_region: shopData.trainingRegion === 'other' 
              ? shopData.trainingRegionOther 
              : shopData.trainingRegion,
            program_track: shopData.programTrack,
            shop_name: shopData.shopName,
            shop_address: shopData.shopAddress,
            shop_phone: shopData.shopPhone,
            owner_manager_name: shopData.ownerManagerName,
            supervisor_name: shopData.supervisorName,
            supervisor_license_type: shopData.supervisorLicenseType,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      const result = await response.json();

      // Redirect to success page with application details
      if (result.id) {
        const params = new URLSearchParams({
          id: result.id,
          email: result.email || formData.email,
        });
        if (result.program) {
          params.append('program', result.program);
        }
        window.location.href = `/apply/success?${params.toString()}`;
      } else {
        // Fallback to inline success
        setStatus('success');
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            program: programParam || '',
            message: '',
            state_code: 'IN',
          });
          setStatus('idle');
        }, 5000);
      }
    } catch (error) { /* Error handled silently */ 
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative h-[300px] overflow-hidden">
        <Image
          src="/images/heroes/contact-hero.jpg"
          alt="Talk to an advisor"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={90}
        />
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Start Your Application
          </h1>
          <p className="text-base md:text-lg text-black mb-6">
            Tell us about your goals and we'll match you with the right training program. No phone call needed — complete everything online and get a response within 24 hours for
            you.
          </p>
          <p className="text-lg text-black mb-6">
            Contact us at{' '}
            <a
              href="/support"
              className="font-bold text-brand-orange-600 hover:text-brand-orange-700"
            >
              support center
            </a>{' '}
            or fill out the quick inquiry form below.
          </p>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-8">
            <p className="text-black font-semibold mb-3">
              Ready to apply? Complete our full application form:
            </p>
            <a
              href="/apply/full"
              className="inline-block px-8 py-3 bg-brand-orange-600 text-white font-bold text-lg rounded-lg hover:bg-brand-orange-700 transition shadow-md"
            >
              Go to Full Application Form →
            </a>
          </div>
        </div>

        {(programParam === 'barber-apprenticeship' ||
          formData.program === 'barber') && (
          <div className="mb-8">
            <ApprenticeshipBadge />
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">•</span>
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Inquiry Received!
              </h2>
              <p className="text-black mb-4">
                Thank you for your interest! We've received your inquiry and
                sent a confirmation to your email.
              </p>
              <p className="text-sm text-black mb-6">
                An advisor will contact you within 1-2 business days to discuss
                your goals and next steps.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-700 transition"
                >
                  Send Another Inquiry
                </button>
                <div>
                  <a
                    href="/apply/full"
                    className="inline-block text-brand-orange-600 hover:text-brand-orange-700 font-semibold underline"
                  >
                    Or complete the full application form →
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="your.email@gmail.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Get Help Online"
                />
              </div>

              <div>
                <label
                  htmlFor="program"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Program of Interest
                </label>
                <select
                  id="program"
                  value={formData.program}
                  onChange={(e) => {
                    setFormData({ ...formData, program: e.target.value });
                    // Auto-set program track for apprenticeship programs
                    if (e.target.value.includes('barber')) {
                      setShopData((prev) => ({ ...prev, programTrack: 'barber' }));
                    } else if (e.target.value.includes('cosmetology')) {
                      setShopData((prev) => ({ ...prev, programTrack: 'cosmetology' }));
                    } else if (e.target.value.includes('esthetician')) {
                      setShopData((prev) => ({ ...prev, programTrack: 'esthetician' }));
                    } else if (e.target.value.includes('nail')) {
                      setShopData((prev) => ({ ...prev, programTrack: 'nail-technician' }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a program...</option>
                  <optgroup label="Beauty Industry Apprenticeships">
                    <option value="barber-apprenticeship">Barber Apprenticeship</option>
                    <option value="cosmetology-apprenticeship">Cosmetology Apprenticeship</option>
                    <option value="esthetician-apprenticeship">Esthetician Apprenticeship</option>
                    <option value="nail-technician-apprenticeship">Nail Technician Apprenticeship</option>
                  </optgroup>
                  <optgroup label="Other Programs">
                    <option value="dsp">
                      Direct Support Professional (DSP)
                    </option>
                    <option value="hvac">HVAC Technician</option>
                    <option value="ehst">Emergency Health & Safety Tech</option>
                    <option value="prc">Peer Recovery Coach</option>
                    <option value="tax">Tax Prep & Financial Services</option>
                    <option value="biz">Business Startup & Marketing</option>
                  </optgroup>

                  <optgroup label="Micro Courses (Partner Programs)">
                    <option value="cpr">CPR Certification</option>
                    <option value="osha-10">OSHA 10-Hour Safety</option>
                    <option value="forklift">Forklift Operator</option>
                    <option value="first-aid">First Aid Certification</option>
                  </optgroup>

                  <option value="other">Other / Not Sure</option>
                </select>
              </div>

              {/* Apprenticeship Shop Fields - Only show for apprenticeship programs */}
              {isApprenticeshipProgram && (
                <div className="border-t border-slate-200 pt-6 mt-6">
                  <ApprenticeshipShopFields
                    formData={shopData}
                    onChange={(data) => setShopData((prev) => ({ ...prev, ...data }))}
                    errors={shopErrors}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Additional Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Tell us about your goals and any questions you have..."
                />
              </div>

              <input type="hidden" name="state_code" value="IN" />

              <ComplianceNotice
                policies={getPoliciesForFeature('application')}
                context="By submitting this application, you acknowledge and agree to comply with:"
                variant="compact"
                className="mb-4"
              />

              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">
                    Something went wrong. Please try again or contact us at
                    support center.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-brand-orange-600 text-white font-bold text-lg rounded-lg hover:bg-brand-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading'
                  ? 'Opening Email...'
                  : 'Send Inquiry via Email'}
              </button>

              <div className="text-center space-y-2">
                <p className="text-sm text-black">
                  This will open your email client to send to:{' '}
                  <span className="font-semibold">
                    elevate4humanityedu@gmail.com
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  By submitting an application, you acknowledge that all
                  platform systems, program structures, and instructional
                  workflows are the intellectual property of Elevate for
                  Humanity.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
