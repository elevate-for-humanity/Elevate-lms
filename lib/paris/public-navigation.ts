export interface ParisPublicDestination {
  href: string;
  label: string;
}

const NAVIGATION_INTENT = /\b(?:open|show|go\s+to|take\s+me|bring\s+me|navigate|visit|view)\b/i;

const PUBLIC_DESTINATIONS: Array<{
  match: RegExp;
  destination: ParisPublicDestination;
}> = [
  {
    match: /\b(?:barber|barbering)\b/i,
    destination: { href: '/programs/barber-apprenticeship', label: 'Barber Apprenticeship' },
  },
  {
    match: /\b(?:programs?|courses?|training)\b/i,
    destination: { href: '/programs', label: 'Program Directory' },
  },
  {
    match: /\b(?:funding|financial\s+aid|wioa|workforce\s+ready\s+grant)\b/i,
    destination: { href: '/funding', label: 'Funding' },
  },
  {
    match: /\b(?:apply|application|enroll|enrollment)\b/i,
    destination: { href: '/apply', label: 'Application' },
  },
  {
    match: /\b(?:contact|admissions|help)\b/i,
    destination: { href: '/contact', label: 'Contact Admissions' },
  },
];

/** Resolve only explicit public navigation requests. Informational questions stay in chat. */
export function resolvePublicNavigation(command: string): ParisPublicDestination | null {
  if (!NAVIGATION_INTENT.test(command)) return null;
  return PUBLIC_DESTINATIONS.find(({ match }) => match.test(command))?.destination ?? null;
}

/** Convert plain, safe same-origin routes returned by PARIS into tappable Markdown links. */
export function linkifyParisRoutes(content: string): string {
  return content
    .replace(/\*\*(\/[a-z0-9/_-]+)\*\*/gi, '[$1]($1)')
    .replace(/(^|[\s(])(https?:\/\/[^\s)<>]+)/gi, '$1[$2]($2)')
    .replace(/(^|[\s(])(\/[a-z0-9][a-z0-9/_-]*)(?=$|[\s.,!?;:)])/gim, '$1[$2]($2)');
}
