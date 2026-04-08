/**
 * NHA training partner pricing — study materials, prep packages, and bundled programs.
 *
 * Requires: NHA Training Partner Agreement (separate from Testing Center account #412957).
 * Do not expose on public pages until that agreement is confirmed active.
 *
 * TWO SEPARATE NHA REVENUE STREAMS:
 *   1. Testing center fees  → proctoring-capabilities.ts (exam proctoring, $243/seat)
 *   2. Training materials   → this file (prep materials, study guides, bundled programs)
 *
 * Vendor base prices are NHA wholesale catalog rates for authorized training partners.
 * Keep vendorBasePrice internal/admin only — never render it on public pages.
 *
 * Markup rules:
 *   study_guide / practice_test / exam_prep  → 1.40×
 *   cert_exam                                → 1.35×
 *   core_module / competency_module          → 1.45×
 *   professional_module                      → 1.50×
 *   bundle                                   → 1.30× on discounted base, rounded to nearest $X9
 *
 * Lead programs (show first on public pages):
 *   1. Medical Assistant
 *   2. Pharmacy Technician
 *   3. Phlebotomy Technician
 *   4. Billing and Coding
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type NhaPriceType =
  | 'study_guide'
  | 'practice_test'
  | 'exam_prep'
  | 'cert_exam'
  | 'core_module'
  | 'competency_module'
  | 'professional_module'
  | 'bundle';

export interface NhaProduct {
  key:             string;
  label:           string;
  vendorBase:      number;
  type:            NhaPriceType;
  /**
   * Explicit retail price override. Use only when the formula produces a price
   * that differs from the agreed retail target. Documents the intentional deviation.
   */
  retailOverride?: number;
}

export interface NhaProgram {
  key:                  string;
  label:                string;
  /** Short benefit statement shown under price on public pages */
  tagline:              string;
  products:             NhaProduct[];
  /** NHA's pre-discounted bundle price — apply bundle markup to get retail */
  bundledDiscountedBase?: number;
  /** Show payment plan note when retail bundle price exceeds this threshold */
  paymentPlanThreshold: number;
  /** Whether this is a lead program (shown first on public pages) */
  featured:             boolean;
}

// ─── Markup engine ────────────────────────────────────────────────────────────

const MARKUP_MULTIPLIERS: Record<NhaPriceType, number> = {
  study_guide:         1.40,
  practice_test:       1.40,
  exam_prep:           1.40,
  cert_exam:           1.35,
  core_module:         1.45,
  competency_module:   1.45,
  professional_module: 1.50,
  bundle:              1.30,
};

/**
 * Rounds a price up to the nearest value ending in 9.
 * $100 → $109, $110 → $119, $119 → $119, $120 → $129
 */
export function roundToPsychologicalPrice(value: number): number {
  const ceiled    = Math.ceil(value);
  const remainder = ceiled % 10;
  if (remainder === 9) return ceiled;
  return ceiled + ((9 - remainder + 10) % 10);
}

/**
 * Applies the markup multiplier for a given price type and rounds to $X9.
 */
export function markupPrice(base: number, type: NhaPriceType): number {
  return roundToPsychologicalPrice(base * MARKUP_MULTIPLIERS[type]);
}

/**
 * Returns the retail price for a single product.
 * Respects retailOverride when the formula deviates from the agreed target.
 * Use this for a la carte display and checkout.
 */
export function getRetailPrice(product: NhaProduct): number {
  return product.retailOverride ?? markupPrice(product.vendorBase, product.type);
}

/**
 * Returns the retail bundle price for a program, or null if no bundle exists.
 * Use this for the primary price shown on public program cards.
 */
export function getBundleRetailPrice(program: NhaProgram): number | null {
  if (program.bundledDiscountedBase == null) return null;
  return markupPrice(program.bundledDiscountedBase, 'bundle');
}

/**
 * Returns whether a payment plan note should be shown for a program.
 */
export function showPaymentPlan(program: NhaProgram): boolean {
  const retail = getBundleRetailPrice(program);
  return retail != null && retail >= program.paymentPlanThreshold;
}

// ─── Program catalog ──────────────────────────────────────────────────────────

export const NHA_PROGRAMS: Record<string, NhaProgram> = {

  medicalAssistant: {
    key:     'medicalAssistant',
    label:   'Medical Assistant',
    tagline: 'Includes exam prep and learner support',
    featured: true,
    paymentPlanThreshold: 499,
    bundledDiscountedBase: 704.80,
    products: [
      // retailOverride: formula produces $139 (1.45 × $94 = $136.30 → $139) but target is $129
      { key: 'prepMaterials',              label: 'Prep Materials',                vendorBase: 94,  type: 'core_module',         retailOverride: 129 },
      { key: 'certificationExam',          label: 'Certification Exam (CCMA)',      vendorBase: 165, type: 'cert_exam'            },
      { key: 'medicalTerminology',         label: 'Medical Terminology',            vendorBase: 75,  type: 'core_module'         },
      { key: 'anatomyPhysiology',          label: 'Anatomy & Physiology',           vendorBase: 75,  type: 'core_module'         },
      { key: 'clinicalPlus',               label: 'Clinical Plus',                  vendorBase: 129, type: 'competency_module'   },
      { key: 'administrativePlus',         label: 'Administrative Plus',            vendorBase: 129, type: 'competency_module'   },
      { key: 'personAbility',              label: 'PersonAbility',                  vendorBase: 80,  type: 'professional_module' },
      { key: 'principlesOfHealthCoaching', label: 'Principles of Health Coaching',  vendorBase: 150, type: 'professional_module' },
    ],
  },

  medicalAdminAssistant: {
    key:     'medicalAdminAssistant',
    label:   'Medical Administrative Assistant',
    tagline: 'Includes exam prep and learner support',
    featured: false,
    paymentPlanThreshold: 499,
    bundledDiscountedBase: 342,
    products: [
      { key: 'prepMaterials',      label: 'Prep Materials',                  vendorBase: 84,  type: 'core_module'       },
      { key: 'certificationExam',  label: 'Certification Exam (CMAA)',        vendorBase: 129, type: 'cert_exam'          },
      { key: 'medicalTerminology', label: 'Medical Terminology',              vendorBase: 75,  type: 'core_module'       },
      { key: 'administrativePlus', label: 'Administrative Plus',              vendorBase: 129, type: 'competency_module' },
    ],
  },

  electronicHealthRecords: {
    key:     'electronicHealthRecords',
    label:   'Electronic Health Records',
    tagline: 'Includes exam prep and learner support',
    featured: false,
    paymentPlanThreshold: 499,
    products: [
      { key: 'studyGuide',        label: 'Study Guide',          vendorBase: 50,  type: 'study_guide'  },
      { key: 'practiceTest',      label: 'Practice Test',        vendorBase: 44,  type: 'practice_test' },
      { key: 'examPrepPackage',   label: 'Exam Prep Package',    vendorBase: 75,  type: 'exam_prep'    },
      { key: 'certificationExam', label: 'Certification Exam',   vendorBase: 129, type: 'cert_exam'    },
    ],
  },

  billingAndCoding: {
    key:     'billingAndCoding',
    label:   'Billing and Coding',
    tagline: 'Includes exam prep and learner support',
    featured: true,
    paymentPlanThreshold: 499,
    products: [
      // retailOverride: formula produces $99 (1.4 × $64 = $89.60 → $99) but target is $89
      { key: 'studyGuide',        label: 'Study Guide',          vendorBase: 64,  type: 'study_guide',  retailOverride: 89 },
      { key: 'practiceTest',      label: 'Practice Test',        vendorBase: 49,  type: 'practice_test' },
      { key: 'examPrepPackage',   label: 'Exam Prep Package',    vendorBase: 84,  type: 'exam_prep'    },
      { key: 'certificationExam', label: 'Certification Exam',   vendorBase: 129, type: 'cert_exam'    },
    ],
  },

  ekgTechnician: {
    key:     'ekgTechnician',
    label:   'EKG Technician',
    tagline: 'Includes exam prep and learner support',
    featured: false,
    paymentPlanThreshold: 499,
    products: [
      { key: 'studyGuide',        label: 'Study Guide',          vendorBase: 54,  type: 'study_guide'  },
      { key: 'practiceTest',      label: 'Practice Test',        vendorBase: 49,  type: 'practice_test' },
      { key: 'examPrepPackage',   label: 'Exam Prep Package',    vendorBase: 84,  type: 'exam_prep'    },
      { key: 'certificationExam', label: 'Certification Exam (CET)', vendorBase: 129, type: 'cert_exam' },
    ],
  },

  phlebotomy: {
    key:     'phlebotomy',
    label:   'Phlebotomy Technician',
    tagline: 'Includes exam prep and learner support',
    featured: true,
    paymentPlanThreshold: 499,
    products: [
      { key: 'studyGuide',        label: 'Study Guide',          vendorBase: 54,  type: 'study_guide'  },
      { key: 'practiceTest',      label: 'Practice Test',        vendorBase: 49,  type: 'practice_test' },
      { key: 'examPrepPackage',   label: 'Exam Prep Package',    vendorBase: 84,  type: 'exam_prep'    },
      { key: 'certificationExam', label: 'Certification Exam (CPT)', vendorBase: 129, type: 'cert_exam' },
    ],
  },

  patientCareTechnician: {
    key:     'patientCareTechnician',
    label:   'Patient Care Technician',
    tagline: 'Includes exam prep and learner support',
    featured: false,
    paymentPlanThreshold: 499,
    bundledDiscountedBase: 499,
    products: [
      { key: 'prepMaterials',       label: 'Prep Materials',                  vendorBase: 84,  type: 'core_module'       },
      { key: 'certificationExam',   label: 'Certification Exam (CPCT/A)',      vendorBase: 165, type: 'cert_exam'          },
      { key: 'medicalTerminology',  label: 'Medical Terminology',              vendorBase: 75,  type: 'core_module'       },
      { key: 'anatomyPhysiology',   label: 'Anatomy & Physiology',             vendorBase: 75,  type: 'core_module'       },
      { key: 'pctSkillsBuilderPlus',label: 'PCT SkillsBuilder Plus',           vendorBase: 129, type: 'competency_module' },
      { key: 'personAbility',       label: 'PersonAbility',                    vendorBase: 80,  type: 'professional_module'},
    ],
  },

  pharmacyTechnician: {
    key:     'pharmacyTechnician',
    label:   'Pharmacy Technician',
    tagline: 'Includes exam prep and learner support',
    featured: true,
    paymentPlanThreshold: 499,
    bundledDiscountedBase: 555,
    products: [
      // retailOverride: formula produces $139 (1.45 × $89 = $129.05 → $139) but target is $129
      { key: 'prepMaterials',     label: 'Prep Materials',              vendorBase: 89,  type: 'core_module',         retailOverride: 129 },
      { key: 'certificationExam', label: 'Certification Exam (ExCPT)',   vendorBase: 129, type: 'cert_exam'            },
      // retailOverride: formula produces $439 (1.5 × $289 = $433.50 → $439) but target is $419
      { key: 'pharmaSeer',        label: 'PharmaSeer',                   vendorBase: 289, type: 'professional_module', retailOverride: 419 },
      { key: 'pharmaSeerMath',    label: 'PharmaSeer Math',              vendorBase: 125, type: 'professional_module' },
      { key: 'personAbility',     label: 'PersonAbility',                vendorBase: 80,  type: 'professional_module' },
    ],
  },

} as const satisfies Record<string, NhaProgram>;

// ─── Ordered lists for rendering ─────────────────────────────────────────────

/** Featured programs — shown first on public pages, in priority order */
export const NHA_FEATURED_PROGRAMS: NhaProgram[] = [
  NHA_PROGRAMS.medicalAssistant,
  NHA_PROGRAMS.pharmacyTechnician,
  NHA_PROGRAMS.phlebotomy,
  NHA_PROGRAMS.billingAndCoding,
];

/** All programs — for admin views and full catalog pages */
export const NHA_ALL_PROGRAMS: NhaProgram[] = Object.values(NHA_PROGRAMS);

// ─── Retail price lookup ──────────────────────────────────────────────────────

/**
 * Returns the primary display price for a program:
 *   - Bundle retail price if the program has a bundle
 *   - null if the program is a la carte only (show individual product prices)
 */
export function getProgramDisplayPrice(programKey: keyof typeof NHA_PROGRAMS): number | null {
  const program = NHA_PROGRAMS[programKey];
  return getBundleRetailPrice(program);
}

/**
 * Returns a la carte retail prices for all products in a program.
 * Keyed by product key for easy lookup in components.
 */
export function getAlaCarteRetailPrices(
  programKey: keyof typeof NHA_PROGRAMS
): Record<string, number> {
  const program = NHA_PROGRAMS[programKey];
  return Object.fromEntries(
    program.products.map(p => [p.key, getRetailPrice(p)])
  );
}
