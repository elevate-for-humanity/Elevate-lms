/**
 * Payments API IDOR Protection Tests
 *
 * Tests that payment operations verify resource ownership
 * to prevent Insecure Direct Object Reference (IDOR) attacks.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock types
interface User {
  id: string;
  email: string;
  stripe_customer_id: string | null;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
}

interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
}

interface PaymentMethod {
  id: string;
  customer: string;
  type: string;
  last4: string;
}

// Mock database
class MockDatabase {
  users: Map<string, User> = new Map();
  payments: Map<string, Payment> = new Map();
  subscriptions: Map<string, Subscription> = new Map();
  paymentMethods: Map<string, PaymentMethod> = new Map();

  constructor() {
    // Seed test data
    this.users.set('user-1', {
      id: 'user-1',
      email: 'user1@test.com',
      stripe_customer_id: 'cus_user1',
    });
    this.users.set('user-2', {
      id: 'user-2',
      email: 'user2@test.com',
      stripe_customer_id: 'cus_user2',
    });
    this.users.set('user-no-stripe', {
      id: 'user-no-stripe',
      email: 'nostripe@test.com',
      stripe_customer_id: null,
    });

    this.payments.set('payment-1', {
      id: 'payment-1',
      user_id: 'user-1',
      amount: 100,
      status: 'succeeded',
    });
    this.payments.set('payment-2', {
      id: 'payment-2',
      user_id: 'user-2',
      amount: 200,
      status: 'succeeded',
    });

    this.subscriptions.set('sub-1', {
      id: 'sub-1',
      user_id: 'user-1',
      stripe_subscription_id: 'sub_stripe_1',
      status: 'active',
    });
    this.subscriptions.set('sub-2', {
      id: 'sub-2',
      user_id: 'user-2',
      stripe_subscription_id: 'sub_stripe_2',
      status: 'active',
    });

    this.paymentMethods.set('pm-1', {
      id: 'pm-1',
      customer: 'cus_user1',
      type: 'card',
      last4: '4242',
    });
    this.paymentMethods.set('pm-2', {
      id: 'pm-2',
      customer: 'cus_user2',
      type: 'card',
      last4: '1234',
    });
  }
}

// Ownership verification functions (mirrors the actual implementation)
function verifyCustomerOwnership(db: MockDatabase, userId: string, customerId: string): boolean {
  const user = db.users.get(userId);
  return user?.stripe_customer_id === customerId;
}

function verifyPaymentOwnership(db: MockDatabase, userId: string, paymentId: string): boolean {
  const payment = db.payments.get(paymentId);
  return payment?.user_id === userId;
}

function verifySubscriptionOwnership(
  db: MockDatabase,
  userId: string,
  subscriptionId: string,
): boolean {
  const subscription = Array.from(db.subscriptions.values()).find(
    (s) => s.stripe_subscription_id === subscriptionId,
  );
  return subscription?.user_id === userId;
}

function getUserStripeCustomerId(db: MockDatabase, userId: string): string | null {
  const user = db.users.get(userId);
  return user?.stripe_customer_id || null;
}

function verifyPaymentMethodOwnership(db: MockDatabase, userId: string, methodId: string): boolean {
  const userCustomerId = getUserStripeCustomerId(db, userId);
  if (!userCustomerId) return false;

  const paymentMethod = db.paymentMethods.get(methodId);
  return paymentMethod?.customer === userCustomerId;
}

// Mock Payments Service with IDOR protection
class SecurePaymentsService {
  private db: MockDatabase;

  constructor(db: MockDatabase) {
    this.db = db;
  }

  async getPaymentMethods(
    userId: string,
    customerId: string,
  ): Promise<{ success: boolean; error?: string; methods?: PaymentMethod[] }> {
    // IDOR protection: verify customer belongs to user
    if (!verifyCustomerOwnership(this.db, userId, customerId)) {
      return { success: false, error: 'Access denied: customer does not belong to you' };
    }

    const methods = Array.from(this.db.paymentMethods.values()).filter(
      (pm) => pm.customer === customerId,
    );
    return { success: true, methods };
  }

  async processRefund(
    userId: string,
    paymentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // IDOR protection: verify payment belongs to user
    if (!verifyPaymentOwnership(this.db, userId, paymentId)) {
      return { success: false, error: 'Access denied: payment does not belong to you' };
    }

    const payment = this.db.payments.get(paymentId);
    if (payment) {
      payment.status = 'refunded';
    }
    return { success: true };
  }

  async attachPaymentMethod(
    userId: string,
    methodId: string,
    customerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // IDOR protection: verify customer belongs to user
    if (!verifyCustomerOwnership(this.db, userId, customerId)) {
      return { success: false, error: 'Access denied: customer does not belong to you' };
    }

    // Attach method to customer
    const method = this.db.paymentMethods.get(methodId);
    if (method) {
      method.customer = customerId;
    }
    return { success: true };
  }

  async detachPaymentMethod(
    userId: string,
    methodId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // IDOR protection: verify payment method belongs to user's customer
    if (!verifyPaymentMethodOwnership(this.db, userId, methodId)) {
      return { success: false, error: 'Access denied: payment method does not belong to you' };
    }

    this.db.paymentMethods.delete(methodId);
    return { success: true };
  }

  async setDefaultPaymentMethod(
    userId: string,
    customerId: string,
    methodId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // IDOR protection: verify customer belongs to user
    if (!verifyCustomerOwnership(this.db, userId, customerId)) {
      return { success: false, error: 'Access denied: customer does not belong to you' };
    }

    // Set default (mock operation)
    return { success: true };
  }

  async cancelSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    // IDOR protection: verify subscription belongs to user
    if (!verifySubscriptionOwnership(this.db, userId, subscriptionId)) {
      return { success: false, error: 'Access denied: subscription does not belong to you' };
    }

    const subscription = Array.from(this.db.subscriptions.values()).find(
      (s) => s.stripe_subscription_id === subscriptionId,
    );
    if (subscription) {
      subscription.status = 'cancelled';
    }
    return { success: true };
  }
}

describe('Payments API IDOR Protection', () => {
  let db: MockDatabase;
  let paymentsService: SecurePaymentsService;

  beforeEach(() => {
    db = new MockDatabase();
    paymentsService = new SecurePaymentsService(db);
  });

  describe('Customer Ownership Verification', () => {
    it('should allow user to access their own customer', () => {
      const result = verifyCustomerOwnership(db, 'user-1', 'cus_user1');
      expect(result).toBe(true);
    });

    it("should deny access to another user's customer", () => {
      const result = verifyCustomerOwnership(db, 'user-1', 'cus_user2');
      expect(result).toBe(false);
    });

    it('should deny access for non-existent customer', () => {
      const result = verifyCustomerOwnership(db, 'user-1', 'cus_nonexistent');
      expect(result).toBe(false);
    });

    it('should deny access for user without Stripe customer', () => {
      const result = verifyCustomerOwnership(db, 'user-no-stripe', 'cus_user1');
      expect(result).toBe(false);
    });
  });

  describe('Payment Ownership Verification', () => {
    it('should allow user to access their own payment', () => {
      const result = verifyPaymentOwnership(db, 'user-1', 'payment-1');
      expect(result).toBe(true);
    });

    it("should deny access to another user's payment", () => {
      const result = verifyPaymentOwnership(db, 'user-1', 'payment-2');
      expect(result).toBe(false);
    });

    it('should deny access for non-existent payment', () => {
      const result = verifyPaymentOwnership(db, 'user-1', 'payment-nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Subscription Ownership Verification', () => {
    it('should allow user to access their own subscription', () => {
      const result = verifySubscriptionOwnership(db, 'user-1', 'sub_stripe_1');
      expect(result).toBe(true);
    });

    it("should deny access to another user's subscription", () => {
      const result = verifySubscriptionOwnership(db, 'user-1', 'sub_stripe_2');
      expect(result).toBe(false);
    });

    it('should deny access for non-existent subscription', () => {
      const result = verifySubscriptionOwnership(db, 'user-1', 'sub_nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('Payment Method Ownership Verification', () => {
    it('should allow user to access their own payment method', () => {
      const result = verifyPaymentMethodOwnership(db, 'user-1', 'pm-1');
      expect(result).toBe(true);
    });

    it("should deny access to another user's payment method", () => {
      const result = verifyPaymentMethodOwnership(db, 'user-1', 'pm-2');
      expect(result).toBe(false);
    });

    it('should deny access for user without Stripe customer', () => {
      const result = verifyPaymentMethodOwnership(db, 'user-no-stripe', 'pm-1');
      expect(result).toBe(false);
    });
  });

  describe('Get Payment Methods - IDOR Protection', () => {
    it('should return payment methods for own customer', async () => {
      const result = await paymentsService.getPaymentMethods('user-1', 'cus_user1');

      expect(result.success).toBe(true);
      expect(result.methods).toHaveLength(1);
      expect(result.methods![0].last4).toBe('4242');
    });

    it("should deny access to another user's payment methods", async () => {
      const result = await paymentsService.getPaymentMethods('user-1', 'cus_user2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: customer does not belong to you');
    });
  });

  describe('Process Refund - IDOR Protection', () => {
    it('should allow refund for own payment', async () => {
      const result = await paymentsService.processRefund('user-1', 'payment-1');

      expect(result.success).toBe(true);
      expect(db.payments.get('payment-1')?.status).toBe('refunded');
    });

    it("should deny refund for another user's payment", async () => {
      const result = await paymentsService.processRefund('user-1', 'payment-2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: payment does not belong to you');
      expect(db.payments.get('payment-2')?.status).toBe('succeeded'); // Unchanged
    });
  });

  describe('Attach Payment Method - IDOR Protection', () => {
    it('should allow attaching method to own customer', async () => {
      const result = await paymentsService.attachPaymentMethod('user-1', 'pm-new', 'cus_user1');

      expect(result.success).toBe(true);
    });

    it("should deny attaching method to another user's customer", async () => {
      const result = await paymentsService.attachPaymentMethod('user-1', 'pm-new', 'cus_user2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: customer does not belong to you');
    });
  });

  describe('Detach Payment Method - IDOR Protection', () => {
    it('should allow detaching own payment method', async () => {
      const result = await paymentsService.detachPaymentMethod('user-1', 'pm-1');

      expect(result.success).toBe(true);
      expect(db.paymentMethods.has('pm-1')).toBe(false);
    });

    it("should deny detaching another user's payment method", async () => {
      const result = await paymentsService.detachPaymentMethod('user-1', 'pm-2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: payment method does not belong to you');
      expect(db.paymentMethods.has('pm-2')).toBe(true); // Unchanged
    });
  });

  describe('Set Default Payment Method - IDOR Protection', () => {
    it('should allow setting default for own customer', async () => {
      const result = await paymentsService.setDefaultPaymentMethod('user-1', 'cus_user1', 'pm-1');

      expect(result.success).toBe(true);
    });

    it("should deny setting default for another user's customer", async () => {
      const result = await paymentsService.setDefaultPaymentMethod('user-1', 'cus_user2', 'pm-2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: customer does not belong to you');
    });
  });

  describe('Cancel Subscription - IDOR Protection', () => {
    it('should allow cancelling own subscription', async () => {
      const result = await paymentsService.cancelSubscription('user-1', 'sub_stripe_1');

      expect(result.success).toBe(true);
      const subscription = Array.from(db.subscriptions.values()).find(
        (s) => s.stripe_subscription_id === 'sub_stripe_1',
      );
      expect(subscription?.status).toBe('cancelled');
    });

    it("should deny cancelling another user's subscription", async () => {
      const result = await paymentsService.cancelSubscription('user-1', 'sub_stripe_2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied: subscription does not belong to you');
      const subscription = Array.from(db.subscriptions.values()).find(
        (s) => s.stripe_subscription_id === 'sub_stripe_2',
      );
      expect(subscription?.status).toBe('active'); // Unchanged
    });
  });
});

describe('IDOR Attack Scenarios', () => {
  let db: MockDatabase;
  let paymentsService: SecurePaymentsService;

  beforeEach(() => {
    db = new MockDatabase();
    paymentsService = new SecurePaymentsService(db);
  });

  it("should prevent attacker from viewing victim's payment methods", async () => {
    // Attacker (user-1) tries to view victim's (user-2) payment methods
    const attackResult = await paymentsService.getPaymentMethods('user-1', 'cus_user2');

    expect(attackResult.success).toBe(false);
    expect(attackResult.methods).toBeUndefined();
  });

  it("should prevent attacker from processing refund on victim's payment", async () => {
    // Attacker (user-1) tries to refund victim's (user-2) payment
    const attackResult = await paymentsService.processRefund('user-1', 'payment-2');

    expect(attackResult.success).toBe(false);
    // Verify victim's payment is unchanged
    expect(db.payments.get('payment-2')?.status).toBe('succeeded');
  });

  it("should prevent attacker from attaching payment method to victim's account", async () => {
    // Attacker (user-1) tries to attach a payment method to victim's (user-2) customer
    const attackResult = await paymentsService.attachPaymentMethod(
      'user-1',
      'pm-malicious',
      'cus_user2',
    );

    expect(attackResult.success).toBe(false);
  });

  it("should prevent attacker from removing victim's payment method", async () => {
    // Attacker (user-1) tries to detach victim's (user-2) payment method
    const attackResult = await paymentsService.detachPaymentMethod('user-1', 'pm-2');

    expect(attackResult.success).toBe(false);
    // Verify victim's payment method still exists
    expect(db.paymentMethods.has('pm-2')).toBe(true);
  });

  it("should prevent attacker from cancelling victim's subscription", async () => {
    // Attacker (user-1) tries to cancel victim's (user-2) subscription
    const attackResult = await paymentsService.cancelSubscription('user-1', 'sub_stripe_2');

    expect(attackResult.success).toBe(false);
    // Verify victim's subscription is unchanged
    const subscription = Array.from(db.subscriptions.values()).find(
      (s) => s.stripe_subscription_id === 'sub_stripe_2',
    );
    expect(subscription?.status).toBe('active');
  });

  it('should prevent enumeration attacks by returning consistent error messages', async () => {
    // Try accessing non-existent resources - should return same error as unauthorized access
    const nonExistentCustomer = await paymentsService.getPaymentMethods(
      'user-1',
      'cus_nonexistent',
    );
    const unauthorizedCustomer = await paymentsService.getPaymentMethods('user-1', 'cus_user2');

    // Both should fail with access denied (not "not found" which would leak information)
    expect(nonExistentCustomer.success).toBe(false);
    expect(unauthorizedCustomer.success).toBe(false);
    expect(nonExistentCustomer.error).toBe(unauthorizedCustomer.error);
  });
});
