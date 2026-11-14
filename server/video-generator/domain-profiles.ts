export type InstructionalDomainKey =
  | 'barbering'
  | 'cosmetology'
  | 'esthetics'
  | 'nail_technology'
  | 'hvac_epa608'
  | 'healthcare'
  | 'business'
  | 'general';

export type InstructionalDomainProfile = {
  key: InstructionalDomainKey;
  label: string;
  videoStyle: 'trade_demonstration' | 'clinical_demonstration' | 'technical_diagram' | 'workplace_scenario' | 'mixed';
  visualVocabulary: string[];
  safetyFocus: string[];
  introductionArc: string[];
  prohibitedClaims: string[];
};

const COMMON_PROHIBITED_CLAIMS = [
  'Watching a video completes a competency, required hour, license, or certification.',
  'Funding, employment, licensure, exam success, or approval is guaranteed.',
  'A learner may perform regulated work without the authorization stated in the supplied source authority.',
];

export const INSTRUCTIONAL_DOMAIN_PROFILES: Record<InstructionalDomainKey, InstructionalDomainProfile> = {
  barbering: {
    key: 'barbering', label: 'Barbering', videoStyle: 'trade_demonstration',
    visualVocabulary: ['licensed barber demonstrations', 'tools close-up', 'client consultation', 'sanitation procedure'],
    safetyFocus: ['infection control', 'implement disinfection', 'razor safety', 'client protection'],
    introductionArc: ['occupation and services', 'licensing authority', 'training pathway', 'professional standards', 'tools', 'consultation', 'completion evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  cosmetology: {
    key: 'cosmetology', label: 'Cosmetology', videoStyle: 'trade_demonstration',
    visualVocabulary: ['licensed cosmetologist demonstrations', 'hair and scalp analysis', 'chemical service setup', 'thermal styling', 'sanitation procedure'],
    safetyFocus: ['infection control', 'chemical safety', 'thermal safety', 'client draping and protection'],
    introductionArc: ['scope of practice', 'licensing authority', 'training pathway', 'infection control', 'consultation and analysis', 'tools and chemistry', 'practical evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  esthetics: {
    key: 'esthetics', label: 'Esthetics', videoStyle: 'clinical_demonstration',
    visualVocabulary: ['licensed esthetician demonstrations', 'skin analysis', 'facial procedure close-up', 'product handling', 'sanitation procedure'],
    safetyFocus: ['infection control', 'contraindications', 'product safety', 'client draping and privacy'],
    introductionArc: ['scope of practice', 'licensing authority', 'skin science', 'infection control', 'consultation', 'facial tools and products', 'practical evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  nail_technology: {
    key: 'nail_technology', label: 'Nail Technology', videoStyle: 'trade_demonstration',
    visualVocabulary: ['licensed nail technician demonstrations', 'nail analysis', 'manicure procedure close-up', 'product handling', 'station disinfection'],
    safetyFocus: ['infection control', 'chemical exposure', 'ventilation', 'client skin protection'],
    introductionArc: ['scope of practice', 'licensing authority', 'nail science', 'infection control', 'consultation', 'tools and products', 'practical evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  hvac_epa608: {
    key: 'hvac_epa608', label: 'HVAC and EPA 608', videoStyle: 'technical_diagram',
    visualVocabulary: ['HVAC technician demonstrations', 'gauges and meters close-up', 'refrigeration cycle diagram', 'recovery equipment', 'PPE and lockout-tagout'],
    safetyFocus: ['electrical safety', 'refrigerant handling', 'PPE', 'lockout-tagout'],
    introductionArc: ['occupation and systems', 'credential authority', 'refrigeration principles', 'safety', 'tools and measurements', 'service procedure', 'exam and practical evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  healthcare: {
    key: 'healthcare', label: 'Healthcare', videoStyle: 'clinical_demonstration',
    visualVocabulary: ['instructor-led clinical demonstration', 'PPE close-up', 'patient communication scenario', 'equipment setup', 'documentation workflow'],
    safetyFocus: ['standard precautions', 'scope of practice', 'patient privacy', 'infection prevention'],
    introductionArc: ['role and scope', 'governing authority', 'patient safety', 'communication', 'equipment', 'procedure', 'skills verification', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  business: {
    key: 'business', label: 'Business and Workforce', videoStyle: 'workplace_scenario',
    visualVocabulary: ['workplace scenario', 'software workflow', 'document close-up', 'customer interaction', 'decision diagram'],
    safetyFocus: ['data privacy', 'ethical conduct', 'workplace policy', 'accessibility'],
    introductionArc: ['job outcome', 'industry context', 'core workflow', 'professional standards', 'tools', 'worked example', 'performance evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
  general: {
    key: 'general', label: 'Career and Technical Education', videoStyle: 'mixed',
    visualVocabulary: ['instructor demonstration', 'workplace example', 'process diagram', 'tools close-up', 'learner practice'],
    safetyFocus: ['applicable safety rules', 'scope of practice', 'learner protection'],
    introductionArc: ['occupation or outcome', 'governing context', 'core concept', 'safety and ethics', 'tools', 'worked example', 'performance evidence', 'recap'],
    prohibitedClaims: COMMON_PROHIBITED_CLAIMS,
  },
};

export function resolveInstructionalDomainProfile(domainKey?: string | null): InstructionalDomainProfile {
  const normalized = domainKey?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') ?? '';
  if (INSTRUCTIONAL_DOMAIN_PROFILES[normalized as InstructionalDomainKey]) {
    return INSTRUCTIONAL_DOMAIN_PROFILES[normalized as InstructionalDomainKey];
  }

  // These aliases resolve persisted occupation/compliance identifiers, not
  // human-facing course titles. A lesson-level competency such as
  // `infection_control` must be paired with its persisted course profile by
  // the caller rather than guessed here.
  const aliases: Array<[RegExp, InstructionalDomainKey]> = [
    [/(^|_)(barber|barbering)(_|$)/, 'barbering'],
    [/(^|_)(cosmetology|cosmetologist)(_|$)/, 'cosmetology'],
    [/(^|_)(esthetic|esthetics|esthetician)(_|$)/, 'esthetics'],
    [/(^|_)(nail_technology|nail_technician|manicurist)(_|$)/, 'nail_technology'],
    [/(^|_)(hvac|epa_?608|refrigeration)(_|$)/, 'hvac_epa608'],
    [/(^|_)(healthcare|medical|clinical|nursing|cna)(_|$)/, 'healthcare'],
    [/(^|_)(business|workforce|entrepreneurship)(_|$)/, 'business'],
  ];
  const resolved = aliases.find(([pattern]) => pattern.test(normalized))?.[1] ?? 'general';
  return INSTRUCTIONAL_DOMAIN_PROFILES[resolved];
}
