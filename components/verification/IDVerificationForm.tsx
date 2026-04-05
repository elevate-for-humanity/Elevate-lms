'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, AlertCircle } from 'lucide-react';

export function IDVerificationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    ssnLast4: '',
    streetAddress: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    idType: 'drivers_license',
    idNumber: '',
    idState: '',
    idExpiration: '',
  });

  const [files, setFiles] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'idFront' | 'idBack' | 'selfie'
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({
        ...files,
        [field]: e.target.files[0],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate files
      if (!files.idFront || !files.selfie) {
        setError('Please upload ID front and selfie');
        setLoading(false);
        return;
      }

      // Create form data
      const submitData = new FormData();

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });

      // Add files
      submitData.append('idFront', files.idFront);
      if (files.idBack) {
        submitData.append('idBack', files.idBack);
      }
      submitData.append('selfie', files.selfie);

      // Submit
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit verification');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/onboarding/learner?step=verification&status=submitted');
      }, 2000);
    } catch (err: any) {
      setError('Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-brand-green-50 border-2 border-brand-green-600 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <div>
            <h2 className="text-2xl font-bold text-brand-green-900">
              Verification Submitted!
            </h2>
            <p className="text-brand-green-700">
              Your identity verification is being reviewed.
            </p>
          </div>
        </div>
        <p className="text-brand-green-800">
          You'll receive an email notification once your verification is
          approved. This typically takes 1-2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="p-4 bg-brand-red-50 border-2 border-brand-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-brand-red-900">Error</h3>
            <p className="text-brand-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">Personal Information</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Last 4 of SSN (Optional)
            </label>
            <input
              type="text"
              name="ssnLast4"
              value={formData.ssnLast4}
              onChange={handleInputChange}
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="1234"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">Address Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Street Address *
            </label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleInputChange}
              placeholder="Apt, Suite, Unit, etc."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
                maxLength={2}
                placeholder="IN"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                pattern="[0-9]{5}"
                placeholder="46201"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ID Document Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">ID Document Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              ID Type *
            </label>
            <select
              name="idType"
              value={formData.idType}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="drivers_license">Driver's License</option>
              <option value="state_id">State ID</option>
              <option value="passport">Passport</option>
              <option value="military_id">Military ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              ID Number *
            </label>
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Issuing State
            </label>
            <input
              type="text"
              name="idState"
              value={formData.idState}
              onChange={handleInputChange}
              maxLength={2}
              placeholder="IN"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Expiration Date
            </label>
            <input
              type="date"
              name="idExpiration"
              value={formData.idExpiration}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Document Uploads */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4">Upload Documents</h3>
        <div className="space-y-6">
          {/* ID Front */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              ID Front Photo *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-blue-500 transition">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'idFront')}
                required
                className="hidden"
                id="idFront"
              />
              <label htmlFor="idFront" className="cursor-pointer">
                <span className="text-brand-blue-600 font-semibold">
                  Click to upload
                </span>
                <span className="text-black"> or drag and drop</span>
              </label>
              {files.idFront && (
                <p className="mt-2 text-sm text-brand-green-600 font-semibold">
                  • {files.idFront.name}
                </p>
              )}
            </div>
          </div>

          {/* ID Back */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              ID Back Photo (Optional for Passport)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-blue-500 transition">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'idBack')}
                className="hidden"
                id="idBack"
              />
              <label htmlFor="idBack" className="cursor-pointer">
                <span className="text-brand-blue-600 font-semibold">
                  Click to upload
                </span>
                <span className="text-black"> or drag and drop</span>
              </label>
              {files.idBack && (
                <p className="mt-2 text-sm text-brand-green-600 font-semibold">
                  • {files.idBack.name}
                </p>
              )}
            </div>
          </div>

          {/* Selfie */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Selfie Photo *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-brand-blue-500 transition">
              <Camera className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileChange(e, 'selfie')}
                required
                className="hidden"
                id="selfie"
              />
              <label htmlFor="selfie" className="cursor-pointer">
                <span className="text-brand-blue-600 font-semibold">
                  Take a selfie
                </span>
                <span className="text-black"> or upload photo</span>
              </label>
              {files.selfie && (
                <p className="mt-2 text-sm text-brand-green-600 font-semibold">
                  • {files.selfie.name}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-black">
              Take a clear photo of your face. Make sure your face is well-lit
              and clearly visible.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border-2 border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>
    </form>
  );
}
