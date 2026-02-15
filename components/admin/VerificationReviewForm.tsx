'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Shield,
  User,
  Calendar,
  MapPin,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface Props {
  verification: any;
  adminId: string;
}

export function VerificationReviewForm({ verification, adminId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!action) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verifications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: verification.id,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : null,
          adminId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to review verification');
      }

      router.push('/admin/verifications/review?success=true');
      router.refresh();
    } catch (err: any) {
      setError('Failed to review verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-600 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Error</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Full Name</p>
              <p className="font-semibold text-black">
                {verification.first_name} {verification.middle_name}{' '}
                {verification.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Date of Birth</p>
              <p className="font-semibold text-black">
                {new Date(verification.date_of_birth).toLocaleDateString()}
              </p>
            </div>
          </div>
          {verification.ssn_last_4 && (
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-black">SSN (Last 4)</p>
                <p className="font-semibold text-black">
                  ***-**-{verification.ssn_last_4}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">User Account</p>
              <p className="font-semibold text-black">
                {verification.profiles?.full_name || 'Unknown'}
              </p>
              <p className="text-sm text-black">
                {verification.profiles?.email} • {verification.profiles?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Address Information</h2>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
          <div>
            <p className="font-semibold text-black">
              {verification.street_address}
            </p>
            {verification.address_line_2 && (
              <p className="text-black">{verification.address_line_2}</p>
            )}
            <p className="text-black">
              {verification.city}, {verification.state} {verification.zip_code}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">ID Document Information</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">ID Type</p>
              <p className="font-semibold text-black">
                {verification.id_type
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">ID Number</p>
              <p className="font-semibold text-black">
                {verification.id_number}
              </p>
            </div>
          </div>
          {verification.id_state && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-black">Issuing State</p>
                <p className="font-semibold text-black">
                  {verification.id_state}
                </p>
              </div>
            </div>
          )}
          {verification.id_expiration_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-black">Expiration Date</p>
                <p className="font-semibold text-black">
                  {new Date(
                    verification.id_expiration_date
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Uploaded Documents</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-semibold text-black mb-2">
              ID Front
            </p>
            <a
              href={verification.id_front_url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full h-48"
            >
              <Image
                src={verification.id_front_url}
                alt="ID Front"
                fill
                className="object-cover rounded-lg border hover:opacity-80 transition"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </a>
          </div>
          {verification.id_back_url && (
            <div>
              <p className="text-sm font-semibold text-black mb-2">
                ID Back
              </p>
              <a
                href={verification.id_back_url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-full h-48"
              >
                <Image
                  src={verification.id_back_url}
                  alt="ID Back"
                  fill
                  className="object-cover rounded-lg border hover:opacity-80 transition"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </a>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-black mb-2">Selfie</p>
            <a
              href={verification.selfie_url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full h-48"
            >
              <Image
                src={verification.selfie_url}
                alt="Selfie"
                fill
                className="object-cover rounded-lg border hover:opacity-80 transition"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Submission Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">Submitted</p>
              <p className="font-semibold text-black">
                {new Date(verification.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-black">IP Address</p>
              <p className="font-semibold text-black">
                {verification.ip_address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {verification.status === 'pending' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border p-6"
        >
          <h2 className="text-2xl font-bold mb-4">Review Decision</h2>

          <div className="space-y-4 mb-6">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                action === 'approve'
                  ? 'border-green-600 bg-green-50'
                  : 'border-slate-300 hover:border-green-600'
              }`}
            >
              <CheckCircle
                className={`w-6 h-6 ${action === 'approve' ? 'text-green-600' : 'text-slate-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-bold ${action === 'approve' ? 'text-green-900' : 'text-black'}`}
                >
                  Approve Verification
                </p>
                <p
                  className={`text-sm ${action === 'approve' ? 'text-green-700' : 'text-black'}`}
                >
                  Identity verified and approved
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAction('reject')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                action === 'reject'
                  ? 'border-red-600 bg-red-50'
                  : 'border-slate-300 hover:border-red-600'
              }`}
            >
              <XCircle
                className={`w-6 h-6 ${action === 'reject' ? 'text-red-600' : 'text-slate-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-bold ${action === 'reject' ? 'text-red-900' : 'text-black'}`}
                >
                  Reject Verification
                </p>
                <p
                  className={`text-sm ${action === 'reject' ? 'text-red-700' : 'text-black'}`}
                >
                  Identity cannot be verified
                </p>
              </div>
            </button>
          </div>

          {action === 'reject' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={4}
                placeholder="Explain why this verification is being rejected..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          )}

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
              disabled={
                loading || !action || (action === 'reject' && !rejectionReason)
              }
              className="px-8 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {verification.status !== 'pending' && (
        <div
          className={`p-6 rounded-lg border-2 ${
            verification.status === 'approved'
              ? 'bg-green-50 border-green-600'
              : 'bg-red-50 border-red-600'
          }`}
        >
          <h2 className="text-xl font-bold mb-2">
            {verification.status === 'approved'
              ? 'Verification Approved'
              : 'Verification Rejected'}
          </h2>
          <p className="text-sm mb-4">
            Reviewed on {new Date(verification.verified_at).toLocaleString()}
          </p>
          {verification.rejection_reason && (
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-sm font-semibold mb-1">Rejection Reason:</p>
              <p className="text-sm">{verification.rejection_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
