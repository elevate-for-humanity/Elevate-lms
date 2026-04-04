import { type OfferingKind, offeringLabel } from '@/lib/offering-labels';

interface Props {
  kind: OfferingKind;
  className?: string;
}

const STYLES: Record<OfferingKind, string> = {
  program:           'bg-brand-green-100 text-brand-green-800',
  short_term_course: 'bg-brand-blue-100 text-brand-blue-800',
  credential_partner:'bg-violet-100 text-violet-800',
  curriculum_partner:'bg-amber-100 text-amber-800',
};

export function OfferingBadge({ kind, className = '' }: Props) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${STYLES[kind]} ${className}`}>
      {offeringLabel(kind)}
    </span>
  );
}
