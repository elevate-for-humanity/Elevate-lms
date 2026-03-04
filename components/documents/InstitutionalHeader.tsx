import Image from 'next/image';
import { ORG } from '@/lib/documents/elevate-document-system';

interface Props {
  documentType: string;
  title: string;
  subtitle?: string;
  date?: string;
  version?: string;
  referenceNumber?: string;
  /** Hide the divider line below the header */
  noDivider?: boolean;
}

/**
 * Standard institutional header for all Elevate documents.
 * Logo left, org info right, document title centered below.
 * Used on MOUs, reports, handbooks, partner documents, and print views.
 */
export function InstitutionalHeader({
  documentType,
  title,
  subtitle,
  date,
  version,
  referenceNumber,
  noDivider,
}: Props) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="print:mb-6">
      {/* Logo bar */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={ORG.logoUrl}
            alt={ORG.name}
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>
        <div className="text-right text-xs text-slate-500 leading-tight">
          <div className="font-semibold text-slate-700">{ORG.name}</div>
          <div>{ORG.tagline}</div>
          <div>{ORG.website.replace('https://', '')}</div>
        </div>
      </div>

      {/* Divider */}
      {!noDivider && <div className="border-t-2 border-slate-800 mb-6" />}

      {/* Document type label */}
      <div className="text-center mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {documentType}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center leading-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="text-base text-slate-600 text-center mt-2 max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Meta line */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
        <span>{formattedDate}</span>
        {version && <span>Version {version}</span>}
        {referenceNumber && <span>Ref: {referenceNumber}</span>}
      </div>

      {/* Bottom divider */}
      <div className="border-t border-slate-200 mt-6 mb-8" />
    </header>
  );
}
