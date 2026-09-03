/**
 * Enrollment Payment Flow Tests
 *
 * Tests payment processing and enrollment completion
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Payment types
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
type PaymentMethod = 'card' | 'bank_transfer' | 'affirm' | 'free';

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  metadata: {
    user_id: string;
    course_id: string;
    enrollment_id?: string;
  };
  created_at: string;
  completed_at?: string;
}

interface CheckoutSession {
  id: string;
  payment_intent_id: string;
  url: string;
  expires_at: number;
  status: 'open' | 'complete' | 'expired';
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: 'pending_payment' | 'active' | 'completed' | 'dropped';
  payment_status: PaymentStatus;
  payment_amount: number;
}

// Payment service mock
class PaymentService {
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private checkoutSessions: Map<string, CheckoutSession> = new Map();
  private idCounter = 0;

  private generateId(prefix: string): string {
    this.idCounter++;
    return `${prefix}_${this.idCounter}_${Date.now()}`;
  }

  async createPaymentIntent(
    amount: number,
    userId: string,
    courseId: string,
    paymentMethod: PaymentMethod = 'card',
  ): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: this.generateId('pi'),
      amount,
      currency: 'usd',
      status: 'pending',
      payment_method: paymentMethod,
      metadata: {
        user_id: userId,
        course_id: courseId,
      },
      created_at: new Date().toISOString(),
    };
    this.paymentIntents.set(intent.id, intent);
    return intent;
  }

  async createCheckoutSession(
    paymentIntentId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutSession> {
    const session: CheckoutSession = {
      id: this.generateId('cs'),
      payment_intent_id: paymentIntentId,
      url: `https://checkout.stripe.com/pay/${paymentIntentId}`,
      expires_at: Date.now() + 1800000, // 30 minutes
      status: 'open',
    };
    this.checkoutSessions.set(session.id, session);
    return session;
  }

  async processPayment(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    const intent = this.paymentIntents.get(paymentIntentId);
    if (!intent) {
      return { success: false, error: 'Payment intent not found' };
    }

    if (intent.status !== 'pending') {
      return { success: false, error: `Cannot process payment in ${intent.status} status` };
    }

    // Simulate payment processing
    intent.status = 'processing';

    // Simulate successful payment (in real world, this would be async webhook)
    intent.status = 'completed';
    intent.completed_at = new Date().toISOString();

    return { success: true };
  }

  async failPayment(paymentIntentId: string, reason: string): Promise<void> {
    const intent = this.paymentIntents.get(paymentIntentId);
    if (intent) {
      intent.status = 'failed';
    }
  }

  async refundPayment(paymentIntentId: string): Promise<{ success: boolean; error?: string }> {
    const intent = this.paymentIntents.get(paymentIntentId);
    if (!intent) {
      return { success: false, error: 'Payment intent not found' };
    }

    if (intent.status !== 'completed') {
      return { success: false, error: 'Can only refund completed payments' };
    }

    intent.status = 'refunded';
    return { success: true };
  }

  getPaymentIntent(id: string): PaymentIntent | null {
    return this.paymentIntents.get(id) || null;
  }

  getCheckoutSession(id: string): CheckoutSession | null {
    return this.checkoutSessions.get(id) || null;
  }
}

// Enrollment service with payment integration
class PaymentEnrollmentService {
  private paymentService: PaymentService;
  private enrollments: Map<string, Enrollment> = new Map();
  private idCounter = 0;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  private generateId(): string {
    this.idCounter++;
    return `enrollment_${this.idCounter}_${Date.now()}`;
  }

  async initiateEnrollment(
    userId: string,
    courseId: string,
    amount: number,
  ): Promise<{ enrollment: Enrollment; checkoutUrl: string }> {
    // Create pending enrollment
    const enrollment: Enrollment = {
      id: this.generateId(),
      user_id: userId,
      course_id: courseId,
      status: 'pending_payment',
      payment_status: 'pending',
      payment_amount: amount,
    };
    this.enrollments.set(enrollment.id, enrollment);

    // Create payment intent
    const paymentIntent = await this.paymentService.createPaymentIntent(amount, userId, courseId);

    // Update enrollment with payment intent
    paymentIntent.metadata.enrollment_id = enrollment.id;

    // Create checkout session
    const session = await this.paymentService.createCheckoutSession(
      paymentIntent.id,
      `/enrollment/success?id=${enrollment.id}`,
      `/enrollment/cancel?id=${enrollment.id}`,
    );

    return { enrollment, checkoutUrl: session.url };
  }

  async handleFreeEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    const enrollment: Enrollment = {
      id: this.generateId(),
      user_id: userId,
      course_id: courseId,
      status: 'active',
      payment_status: 'completed',
      payment_amount: 0,
    };
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async completeEnrollment(
    enrollmentId: string,
    paymentIntentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    const paymentIntent = this.paymentService.getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
      return { success: false, error: 'Payment intent not found' };
    }

    if (paymentIntent.status !== 'completed') {
      return { success: false, error: 'Payment not completed' };
    }

    enrollment.status = 'active';
    enrollment.payment_status = 'completed';

    return { success: true };
  }

  async handlePaymentFailure(enrollmentId: string): Promise<void> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (enrollment) {
      enrollment.payment_status = 'failed';
    }
  }

  async processRefund(
    enrollmentId: string,
    paymentIntentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    const refundResult = await this.paymentService.refundPayment(paymentIntentId);
    if (!refundResult.success) {
      return refundResult;
    }

    enrollment.status = 'dropped';
    enrollment.payment_status = 'refunded';

    return { success: true };
  }

  getEnrollment(id: string): Enrollment | null {
    return this.enrollments.get(id) || null;
  }
}

describe('Payment Processing', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with correct amount', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');

      expect(intent.id).toBeDefined();
      expect(intent.amount).toBe(29999);
      expect(intent.currency).toBe('usd');
      expect(intent.status).toBe('pending');
    });

    it('should store metadata with user and course info', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');

      expect(intent.metadata.user_id).toBe('user-1');
      expect(intent.metadata.course_id).toBe('course-1');
    });

    it('should support different payment methods', async () => {
      const cardIntent = await paymentService.createPaymentIntent(
        29999,
        'user-1',
        'course-1',
        'card',
      );
      const affirmIntent = await paymentService.createPaymentIntent(
        29999,
        'user-1',
        'course-2',
        'affirm',
      );

      expect(cardIntent.payment_method).toBe('card');
      expect(affirmIntent.payment_method).toBe('affirm');
    });
  });

  describe('Checkout Session', () => {
    it('should create checkout session with URL', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      const session = await paymentService.createCheckoutSession(intent.id, '/success', '/cancel');

      expect(session.id).toBeDefined();
      expect(session.url).toContain('checkout.stripe.com');
      expect(session.status).toBe('open');
    });

    it('should set expiration time', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      const session = await paymentService.createCheckoutSession(intent.id, '/success', '/cancel');

      expect(session.expires_at).toBeGreaterThan(Date.now());
    });
  });

  describe('Payment Processing', () => {
    it('should process pending payment successfully', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      const result = await paymentService.processPayment(intent.id);

      expect(result.success).toBe(true);

      const updatedIntent = paymentService.getPaymentIntent(intent.id);
      expect(updatedIntent?.status).toBe('completed');
      expect(updatedIntent?.completed_at).toBeDefined();
    });

    it('should reject processing non-existent payment', async () => {
      const result = await paymentService.processPayment('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });

    it('should reject processing already completed payment', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      await paymentService.processPayment(intent.id);

      const result = await paymentService.processPayment(intent.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot process payment');
    });
  });

  describe('Refunds', () => {
    it('should refund completed payment', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      await paymentService.processPayment(intent.id);

      const result = await paymentService.refundPayment(intent.id);

      expect(result.success).toBe(true);

      const updatedIntent = paymentService.getPaymentIntent(intent.id);
      expect(updatedIntent?.status).toBe('refunded');
    });

    it('should reject refunding pending payment', async () => {
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');

      const result = await paymentService.refundPayment(intent.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only refund completed payments');
    });
  });
});

describe('Enrollment with Payment', () => {
  let paymentService: PaymentService;
  let enrollmentService: PaymentEnrollmentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    enrollmentService = new PaymentEnrollmentService(paymentService);
  });

  describe('Paid Enrollment Flow', () => {
    it('should create pending enrollment with checkout URL', async () => {
      const result = await enrollmentService.initiateEnrollment('user-1', 'course-1', 29999);

      expect(result.enrollment.id).toBeDefined();
      expect(result.enrollment.status).toBe('pending_payment');
      expect(result.enrollment.payment_status).toBe('pending');
      expect(result.checkoutUrl).toContain('checkout.stripe.com');
    });

    it('should activate enrollment after payment completion', async () => {
      const { enrollment } = await enrollmentService.initiateEnrollment(
        'user-1',
        'course-1',
        29999,
      );

      // Simulate payment processing (would be webhook in real world)
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      intent.metadata.enrollment_id = enrollment.id;
      await paymentService.processPayment(intent.id);

      const result = await enrollmentService.completeEnrollment(enrollment.id, intent.id);

      expect(result.success).toBe(true);

      const updatedEnrollment = enrollmentService.getEnrollment(enrollment.id);
      expect(updatedEnrollment?.status).toBe('active');
      expect(updatedEnrollment?.payment_status).toBe('completed');
    });

    it('should reject completion without payment', async () => {
      const { enrollment } = await enrollmentService.initiateEnrollment(
        'user-1',
        'course-1',
        29999,
      );
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');

      // Don't process payment
      const result = await enrollmentService.completeEnrollment(enrollment.id, intent.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not completed');
    });
  });

  describe('Free Enrollment Flow', () => {
    it('should create active enrollment immediately for free courses', async () => {
      const enrollment = await enrollmentService.handleFreeEnrollment('user-1', 'free-course');

      expect(enrollment.status).toBe('active');
      expect(enrollment.payment_status).toBe('completed');
      expect(enrollment.payment_amount).toBe(0);
    });
  });

  describe('Payment Failure Handling', () => {
    it('should mark enrollment as failed on payment failure', async () => {
      const { enrollment } = await enrollmentService.initiateEnrollment(
        'user-1',
        'course-1',
        29999,
      );

      await enrollmentService.handlePaymentFailure(enrollment.id);

      const updatedEnrollment = enrollmentService.getEnrollment(enrollment.id);
      expect(updatedEnrollment?.payment_status).toBe('failed');
    });
  });

  describe('Refund Flow', () => {
    it('should process refund and drop enrollment', async () => {
      const { enrollment } = await enrollmentService.initiateEnrollment(
        'user-1',
        'course-1',
        29999,
      );

      // Complete payment first
      const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
      await paymentService.processPayment(intent.id);
      await enrollmentService.completeEnrollment(enrollment.id, intent.id);

      // Process refund
      const result = await enrollmentService.processRefund(enrollment.id, intent.id);

      expect(result.success).toBe(true);

      const updatedEnrollment = enrollmentService.getEnrollment(enrollment.id);
      expect(updatedEnrollment?.status).toBe('dropped');
      expect(updatedEnrollment?.payment_status).toBe('refunded');
    });
  });
});

describe('Complete Payment Enrollment Flow', () => {
  let paymentService: PaymentService;
  let enrollmentService: PaymentEnrollmentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    enrollmentService = new PaymentEnrollmentService(paymentService);
  });

  it('should complete full paid enrollment flow', async () => {
    // Step 1: User initiates enrollment
    const { enrollment, checkoutUrl } = await enrollmentService.initiateEnrollment(
      'user-1',
      'course-1',
      29999,
    );
    expect(enrollment.status).toBe('pending_payment');
    expect(checkoutUrl).toBeDefined();

    // Step 2: User completes payment (simulated)
    const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
    intent.metadata.enrollment_id = enrollment.id;

    const paymentResult = await paymentService.processPayment(intent.id);
    expect(paymentResult.success).toBe(true);

    // Step 3: Webhook triggers enrollment completion
    const completionResult = await enrollmentService.completeEnrollment(enrollment.id, intent.id);
    expect(completionResult.success).toBe(true);

    // Step 4: Verify final state
    const finalEnrollment = enrollmentService.getEnrollment(enrollment.id);
    expect(finalEnrollment?.status).toBe('active');
    expect(finalEnrollment?.payment_status).toBe('completed');
    expect(finalEnrollment?.payment_amount).toBe(29999);
  });

  it('should handle payment failure gracefully', async () => {
    // Step 1: User initiates enrollment
    const { enrollment } = await enrollmentService.initiateEnrollment('user-1', 'course-1', 29999);

    // Step 2: Payment fails
    const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
    await paymentService.failPayment(intent.id, 'Card declined');

    // Step 3: Handle failure
    await enrollmentService.handlePaymentFailure(enrollment.id);

    // Step 4: Verify enrollment is not active
    const finalEnrollment = enrollmentService.getEnrollment(enrollment.id);
    expect(finalEnrollment?.status).toBe('pending_payment');
    expect(finalEnrollment?.payment_status).toBe('failed');
  });

  it('should handle refund flow', async () => {
    // Step 1: Complete enrollment
    const { enrollment } = await enrollmentService.initiateEnrollment('user-1', 'course-1', 29999);
    const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
    await paymentService.processPayment(intent.id);
    await enrollmentService.completeEnrollment(enrollment.id, intent.id);

    // Step 2: User requests refund
    const refundResult = await enrollmentService.processRefund(enrollment.id, intent.id);
    expect(refundResult.success).toBe(true);

    // Step 3: Verify final state
    const finalEnrollment = enrollmentService.getEnrollment(enrollment.id);
    expect(finalEnrollment?.status).toBe('dropped');
    expect(finalEnrollment?.payment_status).toBe('refunded');

    const finalIntent = paymentService.getPaymentIntent(intent.id);
    expect(finalIntent?.status).toBe('refunded');
  });
});

describe('Payment Amount Validation', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  it('should handle zero amount for free courses', async () => {
    const intent = await paymentService.createPaymentIntent(0, 'user-1', 'free-course');
    expect(intent.amount).toBe(0);
  });

  it('should handle cents correctly', async () => {
    // $299.99 = 29999 cents
    const intent = await paymentService.createPaymentIntent(29999, 'user-1', 'course-1');
    expect(intent.amount).toBe(29999);
  });

  it('should handle large amounts', async () => {
    // $9,999.99 = 999999 cents
    const intent = await paymentService.createPaymentIntent(999999, 'user-1', 'expensive-course');
    expect(intent.amount).toBe(999999);
  });
});
