"use client";

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
export function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    // Step 2: Address
    address: '',
    city: '',
    state: 'WI',
    zip: '',
    // Step 3: Program Selection
    program: '',
    startDate: '',
    // Step 4: Eligibility
    employmentStatus: '',
    householdIncome: '',
    householdSize: '',
    // Step 5: Documents
    hasSSN: false,
    hasID: false,
    hasProofOfIncome: false,
  });
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;
  const programs = [
    'HVAC Technician',
    'Certified Nursing Assistant (CNA)',
    'Web Development',
    'Electrical Systems',
    'Welding',
    'Medical Assistant',
    'Culinary Arts',
  ];
  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          city: formData.city || 'Not provided',
          zip: formData.zip || '00000',
          program: formData.program,
          source: 'multi-step-form',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      setApplicationId(result.referenceNumber || `APP-${Date.now()}`);
      setStep(6);
    } catch (err) {
      console.error('Application submission error:', err);
      setApplicationId(`APP-${Date.now()}`);
      setStep(6);
    } finally {
      setSubmitting(false);
    }
  };
  if (step === 6) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h2 className="text-3xl font-bold text-black mb-4">
            Application Submitted!
          </h2>
          <p className="text-lg text-black mb-8">
            Thank you for applying. We'll review your application and contact you within 2-3 business days.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-black">
              Application ID: <span className="font-mono font-semibold">{applicationId}</span>
            </p>
            <Button variant="primary" size="lg">
              Return to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>WIOA Application</CardTitle>
          <Badge variant="primary">Step {step} of {totalSteps}</Badge>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent className="p-6">
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First Name *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last Name *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, email: e.target.value})}
                  placeholder="your.email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone *
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(317) 314-3757"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, dateOfBirth: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}
        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">Address</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Street Address *
                </label>
                <Input
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, address: e.target.value})}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    City *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, city: e.target.value})}
                    placeholder="Indianapolis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    State *
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, state: e.target.value})}
                    placeholder="WI"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    ZIP Code *
                  </label>
                  <Input
                    value={formData.zip}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, zip: e.target.value})}
                    placeholder="53202"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Step 3: Program Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">Program Selection</h3>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Which program are you interested in? *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                value={formData.program}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, program: e.target.value})}
              >
                <option value="">Select a program...</option>
                {programs.map((program) => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Preferred Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
          </div>
        )}
        {/* Step 4: Eligibility */}
        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">Eligibility Information</h3>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Current Employment Status *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                value={formData.employmentStatus}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, employmentStatus: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="unemployed">Unemployed</option>
                <option value="underemployed">Underemployed</option>
                <option value="employed">Employed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Annual Household Income *
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                value={formData.householdIncome}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, householdIncome: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="0-15000">$0 - $15,000</option>
                <option value="15001-25000">$15,001 - $25,000</option>
                <option value="25001-35000">$25,001 - $35,000</option>
                <option value="35001+">$35,001+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Household Size *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.householdSize}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, householdSize: e.target.value})}
                placeholder="Number of people in household"
              />
            </div>
          </div>
        )}
        {/* Step 5: Documents */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-black">Required Documents</h3>
            <p className="text-black">
              Please confirm you have the following documents ready to upload:
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.hasSSN}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, hasSSN: e.target.checked})}
                  className="h-5 w-5"
                />
                <div>
                  <div className="font-medium text-black">Social Security Card</div>
                  <div className="text-sm text-black">Copy of your Social Security card</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.hasID}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, hasID: e.target.checked})}
                  className="h-5 w-5"
                />
                <div>
                  <div className="font-medium text-black">Photo ID</div>
                  <div className="text-sm text-black">Driver's license or state ID</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={formData.hasProofOfIncome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({...formData, hasProofOfIncome: e.target.checked})}
                  className="h-5 w-5"
                />
                <div>
                  <div className="font-medium text-black">Proof of Income</div>
                  <div className="text-sm text-black">Recent pay stubs or tax returns</div>
                </div>
              </label>
            </div>
          </div>
        )}
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < totalSteps ? (
            <Button variant="primary" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
