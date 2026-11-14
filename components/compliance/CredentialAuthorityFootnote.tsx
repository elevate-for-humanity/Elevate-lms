import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type CredentialAuthorityFootnoteProps = {
  className?: string;
  /** Show link to full compliance disclosure */
  showComplianceLink?: boolean;
};

/**
 * Small-print credential authority disclaimer — always render at page bottom,
 * never as a prominent hero or centered headline.
 */
export function CredentialAuthorityFootnote({
  className = '',
  showComplianceLink = true,
}: CredentialAuthorityFootnoteProps) {
  return (
    <footer
      className={`border-t border-slate-200 bg-slate-50 py-6 px-4 ${className}`}
      aria-label="Credential authority disclosure"
    >
      <p className="text-[11px] leading-relaxed text-slate-500 max-w-4xl mx-auto text-left sm:text-center">
        Industry certifications, state licenses, and third-party credentials (EPA, CompTIA, NHA,
        PTCB, Indiana PLA, BMV, etc.) are issued by their respective certifying organizations upon
        passing the required examination or meeting state requirements — not by{' '}
        {PLATFORM_DEFAULTS.orgName}. {PLATFORM_DEFAULTS.orgName} provides training and exam
        preparation; the credentialing authority determines pass/fail and issues the credential.{' '}
        {PLATFORM_DEFAULTS.orgName} may issue a program completion certificate documenting
        successful completion of its training curriculum.
        {showComplianceLink && (
          <>
            {' '}
            <Link href="/compliance" className="text-slate-600 underline hover:text-brand-blue-700">
              Full credential disclosure
            </Link>
            .
          </>
        )}
      </p>
    </footer>
  );
}
