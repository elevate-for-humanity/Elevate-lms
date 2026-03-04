import { ORG } from '@/lib/documents/elevate-document-system';

interface Props {
  /** Show confidentiality notice */
  confidential?: boolean;
  /** Additional footer text */
  notice?: string;
}

/**
 * Standard institutional footer for all Elevate documents.
 * Includes org info, confidentiality notice, and page context.
 */
export function DocumentFooter({ confidential, notice }: Props) {
  return (
    <footer className="mt-12 pt-6 border-t-2 border-slate-800">
      <div className="flex items-start justify-between gap-4 text-xs text-slate-500">
        <div className="leading-tight">
          <div className="font-semibold text-slate-700">{ORG.name}</div>
          <div>Operated by {ORG.operator}</div>
          <div>{ORG.address}</div>
        </div>
        <div className="text-right leading-tight">
          <div>{ORG.email}</div>
          <div>{ORG.phone}</div>
          <div>{ORG.website.replace('https://', '')}</div>
        </div>
      </div>
      {confidential && (
        <p className="text-[10px] text-slate-400 mt-4 text-center">
          CONFIDENTIAL — This document contains proprietary information intended solely for the named recipient.
          Unauthorized distribution or reproduction is prohibited.
        </p>
      )}
      {notice && (
        <p className="text-[10px] text-slate-400 mt-2 text-center">{notice}</p>
      )}
    </footer>
  );
}
