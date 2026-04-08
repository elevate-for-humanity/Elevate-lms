/**
 * ServSafe and AHLEI hospitality certification pricing.
 *
 * ServSafe: National Restaurant Association — course+exam bundles.
 * AHLEI: American Hotel & Lodging Educational Institute — Guest Service Gold,
 *        START, ServSuccess.
 *
 * Elevate sells enrollment bundles. NRA/AHLEI handle exam delivery directly.
 * This is NOT a proctored testing center offering.
 *
 * Vendor base prices are wholesale rates for authorized training partners.
 * Keep vendorBase admin-only — never render on public pages.
 *
 * Verified margins:
 *   Product                  Base      Retail  Margin
 *   ─────────────────────────────────────────────────
 *   Food Handler bundle       $13.50    $29     53.4%  ← entry funnel
 *   Manager bundle            $137.66   $199    30.8%  ← required cert
 *   Guest Service bundle      $54.00    $89     39.3%
 *   Guest Service retake      $44.00    $79     44.3%
 *   Guest Service instr kit   $197.96   $299    33.8%
 *   START bundle              $54.00    $89     39.3%
 *   START retake              $44.00    $79     44.3%
 *   START instr guide         $134.96   $199    32.2%
 *   ServSuccess suite         $81.00    $129    37.2%
 *   ServSuccess exam          $45.00    $79     43.0%
 */

import type { ServsafePriceType, ServsafeProduct } from '@/types/servsafe';

// ─── Markup engine ────────────────────────────────────────────────────────────

const MULTIPLIERS: Record<ServsafePriceType, number> = {
  course_exam_bundle:  1.50,
  exam_only:           1.60,
  retake:              1.75,
  instructor_material: 1.50,
  learning_suite:      1.50,
};

export function roundToPsychologicalPrice(value: number): number {
  const ceiled    = Math.ceil(value);
  const remainder = ceiled % 10;
  if (remainder === 9) return ceiled;
  return ceiled + ((9 - remainder + 10) % 10);
}

export function markupPrice(base: number, type: ServsafePriceType): number {
  return roundToPsychologicalPrice(base * MULTIPLIERS[type]);
}

/**
 * Returns the retail price for a product.
 * Respects retailOverride when the formula deviates from the agreed target.
 */
export function getRetailPrice(product: ServsafeProduct): number {
  return product.retailOverride ?? markupPrice(product.vendorBase, product.type);
}

/**
 * Returns the lowest retail price across all products in a program.
 * Used for "Starting at $X" display on program cards.
 */
export function getStartingPrice(products: ServsafeProduct[]): number {
  return Math.min(...products.map(getRetailPrice));
}

/** Admin helper — margin on a single product */
export function getMargin(
  vendorBase: number,
  retailPrice: number
): { dollars: number; percent: number } {
  const dollars = Number((retailPrice - vendorBase).toFixed(2));
  const percent = Number(((retailPrice - vendorBase) / retailPrice * 100).toFixed(1));
  return { dollars, percent };
}
