/**
 * Public program slugs that are aliases or retired duplicates of canonical programs.
 *
 * These may still exist in live `programs` rows, hero banner data, legacy intake
 * links, or old marketing URLs. Keep them out of public catalog/listing surfaces
 * so learners see one card per actual program.
 *
 * TRUE aliases only - canonical programs (cna, barber, phlebotomy, hvac, etc.) are LIVE.
 */
export const DUPLICATE_PROGRAM_ALIAS_SLUGS = [
  // Healthcare - TRUE aliases only
  'cna-cert',                    // alias of cna
  'cna-certification',           // alias of cna
  'certified-nursing-assistant', // alias of cna
  'medical-assistant-program',   // alias of medical-assistant
  'nha-phlebotomy',              // alias of phlebotomy
  'emergency-health-safety-tech', // alias of emergency-health-safety

  // Skilled trades - TRUE aliases only
  'hvac',                       // alias of hvac-technician
  'hvac-tech',                  // alias of hvac-technician
  'hvac-technician-wrg',       // alias of hvac-technician
  'forklift-operator',          // alias of forklift
  'cdl-transportation',         // alias of cdl-training
  'building-maintenance',        // alias of building-maintenance-tech
  'building-maintenance-tech',   // canonical - kept but renamed

  // Beauty - TRUE aliases only
  'nail-tech',                  // alias of nail-technician-apprenticeship

  // Business, technology, and human services - TRUE aliases only
  'it-support-specialist',      // alias of it-help-desk
  'bookkeeping-fundamentals',   // alias of bookkeeping
  'entrepreneurship-small-business', // alias of entrepreneurship
  'peer-recovery-specialist-jri', // alias of peer-recovery-specialist
  'peer-recovery',              // alias of peer-recovery-specialist
  'peer-recovery-coach',        // alias of peer-recovery-specialist
  'peer-support',               // alias of peer-recovery-specialist
  'recovery-coach',             // alias of peer-recovery-specialist
] as const;

export const DUPLICATE_PROGRAM_ALIAS_SLUG_SET = new Set<string>(
  DUPLICATE_PROGRAM_ALIAS_SLUGS,
);
