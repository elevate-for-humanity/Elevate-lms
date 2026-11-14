import { SLUG_ALIASES } from '@/lib/programs/slug';

/** Listing exclusions derive from the same mappings used by intake and DB lookups. */
export const DUPLICATE_PROGRAM_ALIAS_SLUGS = Object.keys(SLUG_ALIASES).filter(
  alias => /^[a-z0-9-]+$/.test(alias) && SLUG_ALIASES[alias] !== alias,
);
export const DUPLICATE_PROGRAM_ALIAS_SLUG_SET = new Set(DUPLICATE_PROGRAM_ALIAS_SLUGS);
