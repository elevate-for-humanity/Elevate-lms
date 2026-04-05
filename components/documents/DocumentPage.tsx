import { InstitutionalHeader } from './InstitutionalHeader';
import { DocumentFooter } from './DocumentFooter';

interface Props {
  documentType: string;
  title: string;
  subtitle?: string;
  date?: string;
  version?: string;
  referenceNumber?: string;
  confidential?: boolean;
  footerNotice?: string;
  children: React.ReactNode;
}

/**
 * Full document page layout with institutional header, content area, and footer.
 * Use this as the wrapper for any formal document: MOUs, handbooks, reports,
 * policy documents, credential alignments, grant narratives.
 *
 * Content goes inside as children — use <DocumentSection> for each section.
 *
 * Print-optimized: proper margins, page breaks, and clean typography.
 */
export function DocumentPage({
  documentType,
  title,
  subtitle,
  date,
  version,
  referenceNumber,
  confidential,
  footerNotice,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8 bg-white print:shadow-none shadow-sm border border-slate-200 print:border-0 my-8 print:my-0">
        <InstitutionalHeader
          documentType={documentType}
          title={title}
          subtitle={subtitle}
          date={date}
          version={version}
          referenceNumber={referenceNumber}
        />

        <main className="print:text-[11pt]">
          {children}
        </main>

        <DocumentFooter
          confidential={confidential}
          notice={footerNotice}
        />
      </div>
    </div>
  );
}
