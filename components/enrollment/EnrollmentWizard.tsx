"use client";

import React from 'react';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface EnrollmentWizardProps {
  programId: string;
  programName: string;
  programSlug: string;
  price: number;
}

const STEPS = [
  { id: 1, name: 'Personal Info', description: 'Basic information' },
  { id: 2, name: 'Contact', description: 'How to reach you' },
  { id: 3, name: 'Background', description: 'Education & experience' },
  { id: 4, name: 'Payment', description: 'Choose payment option' },
];

export default function EnrollmentWizard({
  programId,
  programName,
  programSlug,
  price
}: EnrollmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    education: '',
    experience: '',
    paymentType: 'full'
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Submit enrollment
    const response = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, programId })
    });

    if (response.ok) {
      window.location.href = `/programs/${programSlug}/enroll/payment`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id ? 'bg-brand-blue-600 text-white' : 'bg-gray-200'
                }`}>
                  {currentStep > step.id ? <span className="text-slate-400 flex-shrink-0">•</span> : step.id}
                </div>
                <div className="text-xs mt-2 text-center">
                  <div className="font-semibold">{step.name}</div>
                  <div className="text-gray-500">{step.description}</div>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  currentStep > step.id ? 'bg-brand-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Background</h2>
            <select
              value={formData.education}
              onChange={(e) => updateField('education', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select Education Level</option>
              <option value="high_school">High School</option>
              <option value="some_college">Some College</option>
              <option value="bachelors">Bachelor's Degree</option>
            </select>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Payment Option</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="full"
                  checked={formData.paymentType === 'full'}
                  onChange={(e) => updateField('paymentType', e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-bold">Pay in Full - ${price}</div>
                  <div className="text-sm text-black">One-time payment</div>
                </div>
              </label>
              <label className="flex items-center p-4 border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  value="plan"
                  checked={formData.paymentType === 'plan'}
                  onChange={(e) => updateField('paymentType', e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-bold">Payment Plan - ${Math.ceil(price/4)}/mo</div>
                  <div className="text-sm text-black">4 monthly payments</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-brand-green-600 text-white rounded-lg"
            >
              Complete Enrollment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
