'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
  XCircle,
  Zap,
} from 'lucide-react';

interface SSNVerificationFormProps {
  userId: string;
  onComplete?: () => void;
}

export default function SSNVerificationForm({
  userId,
  onComplete,
}: SSNVerificationFormProps) {
  const [formData, setFormData] = useState({
    ssn: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    verified: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/identity/verify-ssn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          verified: data.verified,
          message: data.message || 'Verification complete',
        });

        if (data.verified && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } else {
        setResult({
          success: false,
          verified: false,
          message: data.error || 'Verification failed',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        verified: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">SSN Verification (FREE)</h2>
        <p className="text-black">
          Verify your Social Security Number with the Social Security
          Administration. This is a free service and helps confirm your
          identity.
        </p>
        <div className="mt-4 p-4 bg-brand-blue-50 border-l-4 border-brand-blue-400">
          <p className="text-sm text-brand-blue-900">
            <strong>
              <CheckCircle className="w-5 h-5 inline-block" /> FREE Service
            </strong>{' '}
            - No cost to verify your SSN
            <br />
            <strong>
              <Lock className="w-5 h-5 inline-block" /> Secure
            </strong>{' '}
            - We only store the last 4 digits
            <br />
            <strong>
              <Zap className="w-5 h-5 inline-block" /> Instant
            </strong>{' '}
            - Results in seconds
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`mb-6 p-4 rounded-lg border-l-4 ${
            result.verified
              ? 'bg-green-50 border-green-400'
              : 'bg-red-50 border-red-400'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.verified ? (
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  result.verified ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {result.verified
                  ? '<CheckCircle className="w-5 h-5 inline-block" /> SSN Verified Successfully'
                  : '<XCircle className="w-5 h-5 inline-block" /> Verification Failed'}
              </p>
              <p
                className={`text-sm mt-1 ${
                  result.verified ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Social Security Number <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.ssn}
            onChange={(e) =>
              setFormData({
                ...formData,
                ssn: formatSSN(e.target.value),
              })
            }
            placeholder="XXX-XX-XXXX"
            maxLength={11}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-black mt-1">
            <Lock className="w-5 h-5 inline-block" /> We only store the last 4
            digits for security
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="First name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Doe"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Date of Birth <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || result?.verified}
            className="w-full bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading
              ? 'Verifying...'
              : result?.verified
                ? 'Verified •'
                : 'Verify SSN (FREE)'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-black">
          <strong>About SSN Verification:</strong>
          <br />
          This free service is provided by the Social Security Administration
          (SSA). It verifies that your SSN, name, and date of birth match SSA
          records. This helps prevent identity fraud and ensures accurate
          payroll processing.
          <br />
          <br />
          <a
            href="https://www.ssa.gov/employer/ssnv.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue-600 hover:underline"
          >
            Learn more about SSA verification →
          </a>
        </p>
      </div>
    </div>
  );
}
