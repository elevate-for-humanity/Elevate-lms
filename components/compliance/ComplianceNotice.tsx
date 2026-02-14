import Link from 'next/link';
import { Shield, FileText, AlertCircle } from 'lucide-react';

interface Policy {
  name: string;
  url: string;
}

interface ComplianceNoticeProps {
  policies: Policy[];
  context?: string;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export function ComplianceNotice({
  policies,
  context = 'By proceeding, you acknowledge and agree to comply with the following policies:',
  variant = 'default',
  className = '',
}: ComplianceNoticeProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-black ${className}`}
      >
        <Shield className="w-4 h-4 text-gray-400" />
        <span>
          Subject to:{' '}
          {policies.map((policy, index) => (
            <span key={policy.url}>
              <Link
                href={policy.url}
                className="text-brand-blue-600 hover:text-brand-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {policy.name}
              </Link>
              {index < policies.length - 1 && ', '}
            </span>
          ))}
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">
              Compliance Requirements
            </h4>
            <p className="text-sm text-amber-800 mb-3">{context}</p>
            <ul className="space-y-2">
              {policies.map((policy) => (
                <li key={policy.url} className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <Link
                    href={policy.url}
                    className="text-sm text-amber-900 hover:text-amber-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {policy.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-black mb-2">{context}</p>
          <div className="flex flex-wrap gap-3">
            {policies.map((policy) => (
              <Link
                key={policy.url}
                href={policy.url}
                className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" />
                {policy.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
