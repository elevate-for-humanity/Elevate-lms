import Link from 'next/link';
import { Shield, Award, ExternalLink, CheckCircle } from 'lucide-react';

interface CredentialBadgeProps {
  variant?: 'compact' | 'full' | 'inline';
  showVerifyLink?: boolean;
  className?: string;
}

const credentials = [
  {
    name: 'DOL Registered',
    shortName: 'DOL',
    description: 'Registered Apprenticeship Sponsor',
    id: 'RAPIDS: 2025-IN-132301',
    icon: Shield,
    color: 'blue',
  },
  {
    name: 'ETPL Listed',
    shortName: 'ETPL',
    description: 'Eligible Training Provider',
    id: 'INTraining: 10004621',
    icon: Award,
    color: 'green',
  },
  {
    name: 'WIOA Approved',
    shortName: 'WIOA',
    description: 'Workforce Innovation & Opportunity Act',
    id: null,
    icon: CheckCircle,
    color: 'purple',
  },
];

export function CredentialBadges({
  variant = 'compact',
  showVerifyLink = true,
  className = '',
}: CredentialBadgeProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        {credentials.map((cred) => (
          <span
            key={cred.shortName}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded"
          >
            <cred.icon className="w-3 h-3" />
            {cred.shortName}
          </span>
        ))}
        {showVerifyLink && (
          <Link href="/verify-credentials" className="text-xs text-brand-blue-600 hover:underline">
            Verify
          </Link>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-slate-50 border rounded-lg p-4 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {credentials.map((cred) => (
              <div
                key={cred.shortName}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full text-sm"
              >
                <cred.icon className={`w-4 h-4 text-${cred.color}-600`} />
                <span className="font-medium text-slate-900">{cred.shortName}</span>
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
            ))}
          </div>
          {showVerifyLink && (
            <Link
              href="/verify-credentials"
              className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
            >
              Verify Credentials <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white border-2 border-slate-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Verified Credentials</h3>
        {showVerifyLink && (
          <Link
            href="/verify-credentials"
            className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
          >
            Verify All <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {credentials.map((cred) => {
          const Icon = cred.icon;
          return (
            <div key={cred.shortName} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div
                className={`w-10 h-10 bg-${cred.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-5 h-5 text-${cred.color}-600`} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{cred.name}</p>
                <p className="text-xs text-slate-700">{cred.description}</p>
                {cred.id && <p className="text-xs text-slate-700 font-mono mt-1">{cred.id}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Standalone badge for footer or small spaces
export function CredentialBadgeStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <span className="text-slate-700">Verified:</span>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-slate-900">
          <Shield className="w-4 h-4 text-brand-blue-600" />
          DOL
        </span>
        <span className="text-slate-700">|</span>
        <span className="inline-flex items-center gap-1 text-slate-900">
          <Award aria-label="award" className="w-4 h-4 text-brand-green-600" />
          ETPL
        </span>
        <span className="text-slate-700">|</span>
        <span className="inline-flex items-center gap-1 text-slate-900">
          <span className="text-slate-400 flex-shrink-0">•</span>
          WIOA
        </span>
      </div>
      <Link href="/verify-credentials" className="text-brand-blue-600 hover:underline">
        Verify →
      </Link>
    </div>
  );
}
