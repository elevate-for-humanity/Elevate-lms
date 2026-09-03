/**
 * Funding Pathway Enforcement Tests
 *
 * These tests verify that policy constraints are enforced in code.
 * Tests MUST FAIL if policy violations are possible.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateBridgePlanTerms,
  validateEmployerSponsorshipTerms,
} from '@/lib/enrollment/funding-enforcement';
import {
  BRIDGE_PLAN_CONSTRAINTS,
  EMPLOYER_SPONSORSHIP_CONSTRAINTS,
  COMPLIANCE_THRESHOLDS,
} from '@/types/enrollment';

describe('Bridge Payment Plan Enforcement', () => {
  describe('Down Payment Validation', () => {
    it('MUST reject down payment below $500', () => {
      const result = validateBridgePlanTerms(400, 200, 3);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Down payment must be at least $${BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT}`,
      );
    });

    it('MUST accept down payment of exactly $500', () => {
      const result = validateBridgePlanTerms(500, 200, 3);
      expect(result.valid).toBe(true);
    });

    it('MUST accept down payment above $500', () => {
      const result = validateBridgePlanTerms(1000, 200, 3);
      expect(result.valid).toBe(true);
    });
  });

  describe('Monthly Payment Validation', () => {
    it('MUST reject monthly payment below $200', () => {
      const result = validateBridgePlanTerms(500, 100, 3);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Monthly payment must be at least $${BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT}`,
      );
    });

    it('MUST accept monthly payment of exactly $200', () => {
      const result = validateBridgePlanTerms(500, 200, 3);
      expect(result.valid).toBe(true);
    });

    it('MUST accept monthly payment above $200', () => {
      const result = validateBridgePlanTerms(500, 500, 3);
      expect(result.valid).toBe(true);
    });
  });

  describe('Term Length Validation', () => {
    it('MUST reject term longer than 3 months', () => {
      const result = validateBridgePlanTerms(500, 200, 4);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Payment plan cannot exceed ${BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS} months`,
      );
    });

    it('MUST reject term of 6 months', () => {
      const result = validateBridgePlanTerms(500, 200, 6);
      expect(result.valid).toBe(false);
    });

    it('MUST reject term of 12 months', () => {
      const result = validateBridgePlanTerms(500, 200, 12);
      expect(result.valid).toBe(false);
    });

    it('MUST accept term of exactly 3 months', () => {
      const result = validateBridgePlanTerms(500, 200, 3);
      expect(result.valid).toBe(true);
    });

    it('MUST accept term of 1 month', () => {
      const result = validateBridgePlanTerms(500, 200, 1);
      expect(result.valid).toBe(true);
    });
  });

  describe('Combined Validation', () => {
    it('MUST reject multiple violations and report all errors', () => {
      const result = validateBridgePlanTerms(100, 50, 12);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });

    it('MUST accept valid bridge plan configuration', () => {
      const result = validateBridgePlanTerms(500, 200, 3);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});

describe('Employer Sponsorship Enforcement', () => {
  describe('Monthly Reimbursement Validation', () => {
    it('MUST reject reimbursement below $250', () => {
      const result = validateEmployerSponsorshipTerms(200, 16);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Monthly reimbursement must be at least $${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_MONTHLY_REIMBURSEMENT}`,
      );
    });

    it('MUST reject reimbursement above $400', () => {
      const result = validateEmployerSponsorshipTerms(500, 16);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Monthly reimbursement cannot exceed $${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_MONTHLY_REIMBURSEMENT}`,
      );
    });

    it('MUST accept reimbursement of $250', () => {
      const result = validateEmployerSponsorshipTerms(250, 16);
      expect(result.valid).toBe(true);
    });

    it('MUST accept reimbursement of $400', () => {
      const result = validateEmployerSponsorshipTerms(400, 16);
      expect(result.valid).toBe(true);
    });

    it('MUST accept reimbursement of $300', () => {
      const result = validateEmployerSponsorshipTerms(300, 16);
      expect(result.valid).toBe(true);
    });
  });

  describe('Term Length Validation', () => {
    it('MUST reject term below 12 months', () => {
      const result = validateEmployerSponsorshipTerms(300, 6);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Term must be at least ${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_TERM_MONTHS} months`,
      );
    });

    it('MUST reject term above 20 months', () => {
      const result = validateEmployerSponsorshipTerms(300, 24);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        `Term cannot exceed ${EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_TERM_MONTHS} months`,
      );
    });

    it('MUST accept term of 12 months', () => {
      const result = validateEmployerSponsorshipTerms(300, 12);
      expect(result.valid).toBe(true);
    });

    it('MUST accept term of 20 months', () => {
      const result = validateEmployerSponsorshipTerms(300, 20);
      expect(result.valid).toBe(true);
    });

    it('MUST accept term of 16 months', () => {
      const result = validateEmployerSponsorshipTerms(300, 16);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Compliance Thresholds', () => {
  it('MUST have Lane 3 threshold at 40%', () => {
    expect(COMPLIANCE_THRESHOLDS.MAX_LANE3_PERCENTAGE).toBe(40);
  });

  it('MUST have max exceptions at 2 per month', () => {
    expect(COMPLIANCE_THRESHOLDS.MAX_EXCEPTIONS_PER_MONTH).toBe(2);
  });

  it('MUST have script deviation retrain threshold at 2', () => {
    expect(COMPLIANCE_THRESHOLDS.MAX_SCRIPT_DEVIATIONS_BEFORE_RETRAIN).toBe(2);
  });
});

describe('Bridge Plan Constraints', () => {
  it('MUST have minimum down payment of $500', () => {
    expect(BRIDGE_PLAN_CONSTRAINTS.MIN_DOWN_PAYMENT).toBe(500);
  });

  it('MUST have minimum monthly payment of $200', () => {
    expect(BRIDGE_PLAN_CONSTRAINTS.MIN_MONTHLY_PAYMENT).toBe(200);
  });

  it('MUST have maximum term of 3 months', () => {
    expect(BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_MONTHS).toBe(3);
  });

  it('MUST have maximum term of 90 days', () => {
    expect(BRIDGE_PLAN_CONSTRAINTS.MAX_TERM_DAYS).toBe(90);
  });

  it('MUST have payment grace period of 3 days', () => {
    expect(BRIDGE_PLAN_CONSTRAINTS.PAYMENT_GRACE_DAYS).toBe(3);
  });
});

describe('Employer Sponsorship Constraints', () => {
  it('MUST have minimum monthly reimbursement of $250', () => {
    expect(EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_MONTHLY_REIMBURSEMENT).toBe(250);
  });

  it('MUST have maximum monthly reimbursement of $400', () => {
    expect(EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_MONTHLY_REIMBURSEMENT).toBe(400);
  });

  it('MUST have minimum term of 12 months', () => {
    expect(EMPLOYER_SPONSORSHIP_CONSTRAINTS.MIN_TERM_MONTHS).toBe(12);
  });

  it('MUST have maximum term of 20 months', () => {
    expect(EMPLOYER_SPONSORSHIP_CONSTRAINTS.MAX_TERM_MONTHS).toBe(20);
  });

  it('MUST have default tuition of $5000', () => {
    expect(EMPLOYER_SPONSORSHIP_CONSTRAINTS.DEFAULT_TUITION).toBe(5000);
  });
});

describe('Policy Violation Prevention', () => {
  describe('No Long-Term Internal Payment Plans', () => {
    it('MUST NOT allow 6-month internal payment plan', () => {
      const result = validateBridgePlanTerms(500, 200, 6);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow 12-month internal payment plan', () => {
      const result = validateBridgePlanTerms(500, 200, 12);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow 24-month internal payment plan', () => {
      const result = validateBridgePlanTerms(500, 200, 24);
      expect(result.valid).toBe(false);
    });
  });

  describe('No Low Monthly Payments', () => {
    it('MUST NOT allow $100/month payment', () => {
      const result = validateBridgePlanTerms(500, 100, 3);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow $50/month payment', () => {
      const result = validateBridgePlanTerms(500, 50, 3);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow $150/month payment', () => {
      const result = validateBridgePlanTerms(500, 150, 3);
      expect(result.valid).toBe(false);
    });
  });

  describe('No Low Down Payments', () => {
    it('MUST NOT allow $0 down payment', () => {
      const result = validateBridgePlanTerms(0, 200, 3);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow $100 down payment', () => {
      const result = validateBridgePlanTerms(100, 200, 3);
      expect(result.valid).toBe(false);
    });

    it('MUST NOT allow $250 down payment', () => {
      const result = validateBridgePlanTerms(250, 200, 3);
      expect(result.valid).toBe(false);
    });
  });
});
