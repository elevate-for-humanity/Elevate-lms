/**
 * Types for EPA 608 certification offerings.
 *
 * TWO DELIVERY MODELS coexist:
 *   1. In-person proctored (ESCO/Mainstream) — lib/testing/providers/epa608-pricing.ts
 *      Required by federal regulation for refrigerant handling certification.
 *      Elevate charges a proctoring fee; candidate sits exam on-site.
 *
 *   2. Online self-paced (Mainstream EPATest platform) — same file, separate section
 *      Mainstream's own online delivery with vendor-level unlimited retakes.
 *      Elevate sells enrollment bundles; candidate takes exam via EPATest.
 *
 * Do not merge these into a single price — they have different cost structures.
 */

export type EpaPriceType =
  | 'online_exam'
  | 'paper_exam'
  | 'reference_manual'
  | 'bundle_basic'
  | 'bundle_premium'
  | 'retake';

export interface EpaProduct {
  key:             string;
  label:           string;
  /** Vendor cost — admin only, never rendered publicly */
  vendorBase:      number;
  type:            EpaPriceType;
  /** Explicit retail price (formula doesn't match targets — see epa608-pricing.ts) */
  retailPrice:     number;
  description?:    string;
}

export interface EpaProgram {
  key:              string;
  label:            string;
  shortDescription: string;
  products:         EpaProduct[];
  featured?:        boolean;
}

export type EpaPartnerStatus = 'pending' | 'approved' | 'active';

export interface EpaPartner {
  key:         string;
  company:     string;
  contactName: string;
  email:       string;
  phone:       string;
  status:      EpaPartnerStatus;
  notes?:      string[];
}

/** Admin margin view — never expose vendorBase or margin on public pages */
export interface EpaProductWithMargin extends EpaProduct {
  marginDollars: number;
  marginPercent: number;
}
