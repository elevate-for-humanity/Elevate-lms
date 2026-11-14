import { LEGAL_ENTITY_OPERATING_LINE } from '@/lib/config/legal-entity';

type Props = {
  className?: string;
};

/**
 * Standard legal operating disclosure for public marketing pages.
 */
export function InstitutionalLegalNotice({ className = '' }: Props) {
  return (
    <p className={`text-xs leading-relaxed text-slate-500 ${className}`.trim()}>
      {LEGAL_ENTITY_OPERATING_LINE}
    </p>
  );
}
