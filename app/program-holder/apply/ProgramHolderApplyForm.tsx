"use client";

import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProgramHolderApplyForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: 'nonprofit',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: 'IN',
    zip: '',
    programsInterested: [] as string[],
    estimatedStudents: '',
    howHeardAboutUs: '',
    additionalInfo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const organizationTypes = [
    { value: 'nonprofit', label: 'Non-Profit Organization' },
    { value: 'government', label: 'Government Agency' },
    { value: 'workforce_board', label: 'Workforce Development Board' },
    { value: 'community_org', label: 'Community Organization' },
    { value: 'educational', label: 'Educational Institution' },
    { value: 'training_provider', label: 'Training Provider' },
    { value: 'other', label: 'Other' },
  ];

  const programOptions = [
    'Barber Training',
    'CNA / Healthcare',
    'CDL / Transportation',
    'HVAC / Building Trades',
    'Medical Assistant',
    'Esthetician / Cosmetology',
    'Building Maintenance',
    'Business & Entrepreneurship',
    'Technology / IT',
    'All Programs',
  ];

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleProgramToggle(program: string) {
    const current = formData.programsInterested;
    if (current.includes(program)) {
      setFormData({
        ...formData,
        programsInterested: current.filter((p) => p !== program),
      });
    } else {
      setFormData({ ...formData, programsInterested: [...current, program] });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      setSubmitting(false);
      return;
    }
    if (!formData.contactName.trim()) {
      setError('Contact name is required');
      setSubmitting(false);
      return;
    }
    if (!formData.contactEmail.trim()) {
      setError('Contact email is required');
      setSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      setSubmitting(false);
      return;
    }
    if (formData.programsInterested.length === 0) {
      setError('Please select at least one program');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/program-holder/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Application submission failed');
      }

      // Redirect to confirmation page with application ID
      router.push(
        `/program-holder/apply/confirmation?id=${data.applicationId}`
      );
    } catch (err: any) {
      const errorMessage =
        err instanceof Error ? err.message : 'Application submission failed';
      setError(errorMessage);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Organization Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">
          Organization Information
        </h3>

        <div>
          <label
            htmlFor="organizationName"
            className="block text-sm font-medium text-black mb-1"
          >
            Organization Name *
          </label>
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            required
            value={formData.organizationName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ABC Training Institute"
          />
        </div>

        <div>
          <label
            htmlFor="organizationType"
            className="block text-sm font-medium text-black mb-1"
          >
            Organization Type *
          </label>
          <select
            id="organizationType"
            name="organizationType"
            required
            value={formData.organizationType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {organizationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">
          Contact Information
        </h3>

        <div>
          <label
            htmlFor="contactName"
            className="block text-sm font-medium text-black mb-1"
          >
            Contact Name *
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            required
            value={formData.contactName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Full name"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-black mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              required
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@gmail.com"
            />
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium text-black mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contact Us"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">Location</h3>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-black mb-1"
          >
            Street Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main St"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-black mb-1"
            >
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Indianapolis"
            />
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-black mb-1"
            >
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="IN"
              maxLength={2}
            />
          </div>

          <div>
            <label
              htmlFor="zip"
              className="block text-sm font-medium text-black mb-1"
            >
              ZIP Code
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="46204"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      {/* Programs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">
          Programs of Interest *
        </h3>
        <p className="text-sm text-black">
          Select all programs you're interested in offering
        </p>

        <div className="grid md:grid-cols-2 gap-3">
          {programOptions.map((program: any) => (
            <label
              key={program}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.programsInterested.includes(program)}
                onChange={() => handleProgramToggle(program)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-black">{program}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-black">
          Additional Information
        </h3>

        <div>
          <label
            htmlFor="estimatedStudents"
            className="block text-sm font-medium text-black mb-1"
          >
            Estimated Number of Students Per Year
          </label>
          <input
            type="number"
            id="estimatedStudents"
            name="estimatedStudents"
            value={formData.estimatedStudents}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="50"
            min="0"
          />
        </div>

        <div>
          <label
            htmlFor="howHeardAboutUs"
            className="block text-sm font-medium text-black mb-1"
          >
            How did you hear about us?
          </label>
          <input
            type="text"
            id="howHeardAboutUs"
            name="howHeardAboutUs"
            value={formData.howHeardAboutUs}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Referral, website, event, etc."
          />
        </div>

        <div>
          <label
            htmlFor="additionalInfo"
            className="block text-sm font-medium text-black mb-1"
          >
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us more about your organization and training goals..."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Application...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
        <p className="text-xs text-black mt-2 text-center">
          By submitting, you agree to our terms and privacy policy
        </p>
      </div>
    </form>
  );
}
