import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Stripe from 'stripe';

/**
 * Stripe Webhook Signature Verification Tests
 *
 * These tests use Stripe's actual constructEvent method to verify
 * signature validation works correctly. No mocking of the signature
 * verification itself.
 */

// Test webhook secret - use a consistent format
const TEST_WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests_only';

// Create a real Stripe instance for testing
const stripe = new Stripe('sk_test_fake_key_for_testing', {
  apiVersion: '2025-10-29.clover' as any,
});

import crypto from 'crypto';

/**
 * Generate a valid Stripe webhook signature
 * This uses Stripe's actual signing algorithm
 */
function generateSignature(payload: string, secret: string, timestamp?: number): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${ts},v1=${signature}`;
}

describe('Stripe Webhook Signature Verification', () => {
  describe('Valid Signatures', () => {
    it('should accept a correctly signed payload', () => {
      const payload = JSON.stringify({
        id: 'evt_test_valid',
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
          },
        },
      });

      const signature = generateSignature(payload, TEST_WEBHOOK_SECRET);

      // This should NOT throw
      const event = stripe.webhooks.constructEvent(payload, signature, TEST_WEBHOOK_SECRET);

      expect(event.id).toBe('evt_test_valid');
      expect(event.type).toBe('checkout.session.completed');
    });

    it('should parse event data correctly', () => {
      const payload = JSON.stringify({
        id: 'evt_test_data',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 29900,
            currency: 'usd',
            metadata: {
              enrollment_id: 'enr_123',
              user_id: 'user_456',
            },
          },
        },
      });

      const signature = generateSignature(payload, TEST_WEBHOOK_SECRET);
      const event = stripe.webhooks.constructEvent(payload, signature, TEST_WEBHOOK_SECRET);

      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      expect(paymentIntent.id).toBe('pi_test_123');
      expect(paymentIntent.amount).toBe(29900);
      expect(paymentIntent.metadata?.enrollment_id).toBe('enr_123');
    });
  });

  describe('Invalid Signatures', () => {
    it('should reject payload with wrong signature', () => {
      const payload = JSON.stringify({
        id: 'evt_test_wrong_sig',
        type: 'checkout.session.completed',
      });

      const wrongSignature = generateSignature(payload, 'wrong_secret');

      expect(() => {
        stripe.webhooks.constructEvent(payload, wrongSignature, TEST_WEBHOOK_SECRET);
      }).toThrow();
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({
        id: 'evt_test_tampered',
        type: 'checkout.session.completed',
        data: { object: { amount: 100 } },
      });

      const signature = generateSignature(originalPayload, TEST_WEBHOOK_SECRET);

      // Tamper with the payload after signing
      const tamperedPayload = JSON.stringify({
        id: 'evt_test_tampered',
        type: 'checkout.session.completed',
        data: { object: { amount: 10000 } }, // Changed amount
      });

      expect(() => {
        stripe.webhooks.constructEvent(tamperedPayload, signature, TEST_WEBHOOK_SECRET);
      }).toThrow();
    });

    it('should reject expired signatures (replay attack prevention)', () => {
      const payload = JSON.stringify({
        id: 'evt_test_expired',
        type: 'checkout.session.completed',
      });

      // Create signature with old timestamp (6 minutes ago, beyond 5 min tolerance)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 360;
      const expiredSignature = generateSignature(payload, TEST_WEBHOOK_SECRET, oldTimestamp);

      expect(() => {
        stripe.webhooks.constructEvent(payload, expiredSignature, TEST_WEBHOOK_SECRET);
      }).toThrow(/timestamp/i);
    });

    it('should reject missing signature header', () => {
      const payload = JSON.stringify({
        id: 'evt_test_no_sig',
        type: 'checkout.session.completed',
      });

      expect(() => {
        stripe.webhooks.constructEvent(payload, '', TEST_WEBHOOK_SECRET);
      }).toThrow();
    });

    it('should reject malformed signature header', () => {
      const payload = JSON.stringify({
        id: 'evt_test_malformed',
        type: 'checkout.session.completed',
      });

      expect(() => {
        stripe.webhooks.constructEvent(
          payload,
          'not_a_valid_signature_format',
          TEST_WEBHOOK_SECRET,
        );
      }).toThrow();
    });
  });

  describe('Idempotency', () => {
    it('should allow tracking of processed event IDs', () => {
      const processedEvents = new Set<string>();

      const processEvent = (eventId: string): boolean => {
        if (processedEvents.has(eventId)) {
          return false; // Already processed
        }
        processedEvents.add(eventId);
        return true; // New event
      };

      const eventId = 'evt_test_idempotent';

      // First processing should succeed
      expect(processEvent(eventId)).toBe(true);

      // Second processing should be detected as duplicate
      expect(processEvent(eventId)).toBe(false);

      // Different event should succeed
      expect(processEvent('evt_test_different')).toBe(true);
    });

    it('should handle concurrent duplicate events', async () => {
      const processedEvents = new Set<string>();
      const processingLocks = new Map<string, Promise<void>>();

      const processEventWithLock = async (
        eventId: string,
      ): Promise<'processed' | 'duplicate' | 'skipped'> => {
        // Check if already processed
        if (processedEvents.has(eventId)) {
          return 'duplicate';
        }

        // Check if currently being processed
        if (processingLocks.has(eventId)) {
          await processingLocks.get(eventId);
          return 'skipped';
        }

        // Start processing
        let resolve: () => void;
        const lock = new Promise<void>((r) => {
          resolve = r;
        });
        processingLocks.set(eventId, lock);

        // Simulate async processing
        await new Promise((r) => setTimeout(r, 10));

        processedEvents.add(eventId);
        processingLocks.delete(eventId);
        resolve!();

        return 'processed';
      };

      const eventId = 'evt_concurrent_test';

      // Simulate concurrent requests
      const results = await Promise.all([
        processEventWithLock(eventId),
        processEventWithLock(eventId),
        processEventWithLock(eventId),
      ]);

      // Only one should be 'processed', others should be 'skipped' or 'duplicate'
      const processedCount = results.filter((r) => r === 'processed').length;
      expect(processedCount).toBe(1);
    });
  });

  describe('Event Type Handling', () => {
    const eventTypes = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'invoice.paid',
      'invoice.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ];

    eventTypes.forEach((eventType) => {
      it(`should correctly parse ${eventType} event`, () => {
        const payload = JSON.stringify({
          id: `evt_test_${eventType.replace(/\./g, '_')}`,
          type: eventType,
          data: {
            object: {
              id: 'obj_test_123',
            },
          },
        });

        const signature = generateSignature(payload, TEST_WEBHOOK_SECRET);
        const event = stripe.webhooks.constructEvent(payload, signature, TEST_WEBHOOK_SECRET);

        expect(event.type).toBe(eventType);
      });
    });
  });
});

describe('Webhook Handler Response Codes', () => {
  it('should return 400 for missing signature', () => {
    // Simulating handler behavior
    const handleWebhook = (signature: string | null) => {
      if (!signature) {
        return { status: 400, error: 'No signature provided' };
      }
      return { status: 200 };
    };

    expect(handleWebhook(null).status).toBe(400);
    expect(handleWebhook('').status).toBe(400);
  });

  it('should return 400 for invalid signature', () => {
    const handleWebhook = (payload: string, signature: string, secret: string) => {
      try {
        stripe.webhooks.constructEvent(payload, signature, secret);
        return { status: 200 };
      } catch {
        return { status: 400, error: 'Invalid signature' };
      }
    };

    const result = handleWebhook('{"id":"test"}', 'invalid_sig', TEST_WEBHOOK_SECRET);
    expect(result.status).toBe(400);
  });

  it('should return 200 for valid webhook', () => {
    const handleWebhook = (payload: string, signature: string, secret: string) => {
      try {
        stripe.webhooks.constructEvent(payload, signature, secret);
        return { status: 200, received: true };
      } catch {
        return { status: 400, error: 'Invalid signature' };
      }
    };

    const payload = JSON.stringify({ id: 'evt_valid', type: 'test' });
    const signature = generateSignature(payload, TEST_WEBHOOK_SECRET);

    const result = handleWebhook(payload, signature, TEST_WEBHOOK_SECRET);
    expect(result.status).toBe(200);
  });
});
