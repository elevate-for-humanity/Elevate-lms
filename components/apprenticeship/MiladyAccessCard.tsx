'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, BookOpen, Loader2, AlertCircle, Copy, Check } from 'lucide-react';

interface MiladyAccessInfo {
  accessUrl?: string;
  licenseCode?: string;
  username?: string;
  status: 'pending_setup' | 'active' | 'expired' | 'not_provisioned';
  method?: 'api' | 'license_code' | 'manual' | 'link';
}

interface MiladyAccessCardProps {
  studentId: string;
  programSlug: string;
  miladyEnrolled?: boolean;
  miladyCompleted?: boolean;
}

const MILADY_LOGIN = 'https://www.miladytraining.com/users/sign_in';

export function MiladyAccessCard({
  studentId,
  programSlug,
  miladyEnrolled = false,
  miladyCompleted = false,
}: MiladyAccessCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<MiladyAccessInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchAccess() {
      try {
        const res = await fetch(`/api/milady/access?studentId=${studentId}&programSlug=${programSlug}`);
        if (res.ok) {
          const data = await res.json();
          setAccessInfo(data);
        } else {
          setAccessInfo({ status: 'not_provisioned' });
        }
      } catch (error) {
        setAccessInfo({ status: 'not_provisioned' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccess();
  }, [studentId, programSlug]);

  const handleCopyCode = () => {
    if (accessInfo?.licenseCode) {
      navigator.clipboard.writeText(accessInfo.licenseCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAccess = () => {
    const url = accessInfo?.accessUrl || MILADY_LOGIN;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  const isActive = accessInfo?.status === 'active' || miladyEnrolled;
  const isPending = accessInfo?.status === 'pending_setup';
  const isPendingApproval = accessInfo?.status === 'pending_approval';
  const isNotProvisioned = accessInfo?.status === 'not_provisioned' && !miladyEnrolled;

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Milady Theory Training</h3>
            <p className="text-purple-200 text-sm">Related Technical Instruction (RTI)</p>
          </div>
        </div>
        {miladyCompleted ? (
          <span className="bg-brand-green-500 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1">
            <span className="text-slate-400 flex-shrink-0">•</span>
            Complete
          </span>
        ) : isActive ? (
          <span className="bg-brand-blue-500 text-white text-xs font-bold px-3 py-2 rounded-full">
            Active
          </span>
        ) : isPending ? (
          <span className="bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Setting Up
          </span>
        ) : null}
      </div>

      {/* License Code Display */}
      {accessInfo?.licenseCode && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
          <p className="text-purple-200 text-sm mb-2">Your License Code (included in program fee):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/20 px-4 py-2 rounded font-mono text-lg tracking-wider">
              {accessInfo.licenseCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-white/20 rounded hover:bg-white/30 transition-all"
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Username Display */}
      {accessInfo?.username && (
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
          <p className="text-purple-200 text-sm mb-1">Your Milady Username:</p>
          <p className="font-mono text-lg">{accessInfo.username}</p>
        </div>
      )}

      {/* Status Message */}
      <p className="text-purple-100 mb-6">
        {miladyCompleted
          ? 'Congratulations! You have completed all theory coursework.'
          : isPendingApproval
            ? (accessInfo as any)?.docsVerified
              ? 'Your enrollment is pending admin approval. You will have access to Milady once approved.'
              : 'Please upload required documents to complete your enrollment and access Milady.'
            : isPending
              ? 'Your Milady access is being set up. You will receive an email with login details within 24 hours.'
              : isActive
                ? 'Your theory training is ready. Click below to access Milady RISE and continue your coursework.'
                : isNotProvisioned
                  ? 'Complete your enrollment to access Milady theory training.'
                  : 'Your Milady access is included in your program fee. Click below to get started.'}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isPendingApproval ? (
          <div className="flex-1 flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-3 px-6 rounded-xl cursor-not-allowed">
            <AlertCircle className="w-5 h-5" />
            {(accessInfo as any)?.docsVerified ? 'Pending Approval' : 'Documents Required'}
          </div>
        ) : isNotProvisioned ? (
          <Link
            href="/programs/barber-apprenticeship"
            className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-700 font-bold py-3 px-6 rounded-xl hover:bg-purple-50 transition-all"
          >
            Complete Enrollment
          </Link>
        ) : (
          <button
            onClick={handleAccess}
            disabled={isPending && !accessInfo?.accessUrl}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-700 font-bold py-3 px-6 rounded-xl hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-5 h-5" />
            {isActive ? 'Open Milady RISE' : isPending ? 'Access Pending...' : 'Access Milady'}
          </button>
        )}
      </div>

      {/* Status Footer */}
      <div className="mt-4 pt-4 border-t border-purple-500/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-200">Status:</span>
          <span className="font-semibold">
            {miladyCompleted
              ? '• Theory Complete'
              : isActive
                ? '📚 In Progress'
                : isPending
                  ? '⏳ Setting Up Access'
                  : '🔗 Ready to Activate'}
          </span>
        </div>
        {accessInfo?.method && (
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-purple-200">Access Type:</span>
            <span className="text-purple-100 capitalize">
              {accessInfo.method === 'license_code' ? 'License Code' : accessInfo.method}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
