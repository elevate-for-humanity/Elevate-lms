import { OrgConfig } from './getOrgConfig';

export interface FundingRules {
  wioa: boolean;
  wrg: boolean;
  jri: boolean;
  employerPaid: boolean;
  selfPay: boolean;
}

/**
 * Get funding rules from org config
 * Defaults to true for backward compatibility
 */
export function getFundingRules(config: OrgConfig): FundingRules {
  return {
    wioa: config?.funding?.wioa !== false,
    wrg: config?.funding?.wrg !== false,
    jri: config?.funding?.jri !== false,
    employerPaid: config?.funding?.employer_paid !== false,
    selfPay: config?.funding?.self_pay !== false,
  };
}
