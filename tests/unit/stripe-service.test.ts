/**
 * Stripe Service Tests
 *
 * Tests for Stripe integration helper functions and data validation
 * Note: Direct Stripe API calls require actual API keys
 */

import { describe, it, expect } from 'vitest';

// Helper functions that would be used with Stripe
function formatAmountForStripe(amount: number, currency: string = 'usd'): number {
  // Stripe expects amounts in cents for USD
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

function formatAmountFromStripe(amount: number, currency: string = 'usd'): number {
  const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];
  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return amount;
  }
  return amount / 100;
}

function validatePaymentIntentParams(params: {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.amount || params.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!params.currency || params.currency.length !== 3) {
    errors.push('Currency must be a 3-letter ISO code');
  }

  if (params.metadata) {
    for (const [key, value] of Object.entries(params.metadata)) {
      if (key.length > 40) {
        errors.push(`Metadata key "${key}" exceeds 40 characters`);
      }
      if (value.length > 500) {
        errors.push(`Metadata value for "${key}" exceeds 500 characters`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function parseStripeError(error: any): { code: string; message: string; type: string } {
  if (error?.type === 'StripeCardError') {
    return {
      code: error.code || 'card_error',
      message: error.message || 'Your card was declined',
      type: 'card_error',
    };
  }
  if (error?.type === 'StripeInvalidRequestError') {
    return {
      code: error.code || 'invalid_request',
      message: error.message || 'Invalid request',
      type: 'invalid_request',
    };
  }
  return {
    code: 'unknown_error',
    message: error?.message || 'An unexpected error occurred',
    type: 'api_error',
  };
}

function calculateRefundAmount(
  originalAmount: number,
  refundType: 'full' | 'partial',
  partialAmount?: number,
): number {
  if (refundType === 'full') {
    return originalAmount;
  }
  if (partialAmount && partialAmount > 0 && partialAmount <= originalAmount) {
    return partialAmount;
  }
  throw new Error('Invalid partial refund amount');
}

describe('StripeService', () => {
  describe('formatAmountForStripe', () => {
    it('should convert dollars to cents for USD', () => {
      expect(formatAmountForStripe(29.99, 'usd')).toBe(2999);
      expect(formatAmountForStripe(100, 'usd')).toBe(10000);
      expect(formatAmountForStripe(0.5, 'usd')).toBe(50);
    });

    it('should handle zero decimal currencies', () => {
      expect(formatAmountForStripe(1000, 'jpy')).toBe(1000);
      expect(formatAmountForStripe(5000, 'krw')).toBe(5000);
    });

    it('should round to nearest cent', () => {
      expect(formatAmountForStripe(29.999, 'usd')).toBe(3000);
      expect(formatAmountForStripe(29.991, 'usd')).toBe(2999);
    });
  });

  describe('formatAmountFromStripe', () => {
    it('should convert cents to dollars for USD', () => {
      expect(formatAmountFromStripe(2999, 'usd')).toBe(29.99);
      expect(formatAmountFromStripe(10000, 'usd')).toBe(100);
    });

    it('should handle zero decimal currencies', () => {
      expect(formatAmountFromStripe(1000, 'jpy')).toBe(1000);
    });
  });

  describe('validatePaymentIntentParams', () => {
    it('should validate correct parameters', () => {
      const result = validatePaymentIntentParams({
        amount: 2999,
        currency: 'usd',
        metadata: { orderId: '123' },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero amount', () => {
      const result = validatePaymentIntentParams({
        amount: 0,
        currency: 'usd',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });

    it('should reject negative amount', () => {
      const result = validatePaymentIntentParams({
        amount: -100,
        currency: 'usd',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject invalid currency code', () => {
      const result = validatePaymentIntentParams({
        amount: 2999,
        currency: 'dollars',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Currency must be a 3-letter ISO code');
    });

    it('should reject metadata key over 40 characters', () => {
      const result = validatePaymentIntentParams({
        amount: 2999,
        currency: 'usd',
        metadata: { this_is_a_very_long_metadata_key_that_exceeds_limit: 'value' },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('parseStripeError', () => {
    it('should parse card errors', () => {
      const error = {
        type: 'StripeCardError',
        code: 'card_declined',
        message: 'Your card was declined',
      };
      const result = parseStripeError(error);
      expect(result.type).toBe('card_error');
      expect(result.code).toBe('card_declined');
    });

    it('should parse invalid request errors', () => {
      const error = {
        type: 'StripeInvalidRequestError',
        code: 'invalid_amount',
        message: 'Amount must be positive',
      };
      const result = parseStripeError(error);
      expect(result.type).toBe('invalid_request');
    });

    it('should handle unknown errors', () => {
      const result = parseStripeError(new Error('Something went wrong'));
      expect(result.type).toBe('api_error');
      expect(result.code).toBe('unknown_error');
    });
  });

  describe('calculateRefundAmount', () => {
    it('should return full amount for full refund', () => {
      expect(calculateRefundAmount(2999, 'full')).toBe(2999);
    });

    it('should return partial amount for partial refund', () => {
      expect(calculateRefundAmount(2999, 'partial', 1000)).toBe(1000);
    });

    it('should throw for invalid partial amount', () => {
      expect(() => calculateRefundAmount(2999, 'partial', 5000)).toThrow();
      expect(() => calculateRefundAmount(2999, 'partial', -100)).toThrow();
      expect(() => calculateRefundAmount(2999, 'partial')).toThrow();
    });
  });
});
