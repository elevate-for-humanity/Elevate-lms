/**
 * Affirm BNPL Integration
 * 
 * Affirm uses a client-side checkout flow:
 * 1. Client loads Affirm JS SDK
 * 2. Client calls affirm.checkout() with order details
 * 3. Customer completes checkout on Affirm modal/redirect
 * 4. Affirm redirects back with checkout_token
 * 5. Server authorizes charge using checkout_token via API
 * 
 * Server-side API is ONLY for:
 * - Authorizing charges (POST /api/v1/transactions)
 * - Capturing charges
 * - Voiding charges
 * - Refunding charges
 */

import { logger } from '@/lib/logger';

// Read from consolidated API_KEYS_JSON first (saves Netlify env var slots),
// then fall back to individual env vars.
let _apiKeys: Record<string, string> = {};
try {
  const raw = process.env.API_KEYS_JSON;
  if (raw) _apiKeys = JSON.parse(raw);
} catch { /* invalid JSON — fall through */ }

function apiKey(key: string, fallback?: string): string | undefined {
  return _apiKeys[key] || process.env[key] || fallback;
}

// Affirm API configuration
const AFFIRM_CONFIG = {
  transactionsUrl: 'https://api.affirm.com/api/v1/transactions',
  baseUrl: 'https://api.affirm.com',
  publicKey: apiKey('AFFIRM_PUBLIC_KEY') || apiKey('NEXT_PUBLIC_AFFIRM_PUBLIC_KEY'),
  privateKey: apiKey('AFFIRM_PRIVATE_KEY') || apiKey('AFFIRM_PRIVATE_API_KEY'),
  environment: process.env.AFFIRM_ENVIRONMENT || 'production',
};

// Sandbox URLs
const SANDBOX_CONFIG = {
  transactionsUrl: 'https://sandbox.affirm.com/api/v1/transactions',
  baseUrl: 'https://sandbox.affirm.com',
};

export interface AffirmChargeResponse {
  id: string;
  created: string;
  currency: string;
  amount: number;
  auth_hold: number;
  payable: number;
  void_balance: number;
  refund_balance: number;
  order_id: string;
  status?: string;
  events?: Array<{
    id: string;
    created: string;
    currency: string;
    amount: number;
    type: string;
  }>;
}

class AffirmClient {
  private publicKey: string | undefined;
  private privateKey: string | undefined;
  private transactionsUrl: string;

  constructor() {
    const isSandbox = AFFIRM_CONFIG.environment === 'sandbox';
    this.publicKey = AFFIRM_CONFIG.publicKey;
    this.privateKey = AFFIRM_CONFIG.privateKey;
    this.transactionsUrl = isSandbox ? SANDBOX_CONFIG.transactionsUrl : AFFIRM_CONFIG.transactionsUrl;
  }

  isConfigured(): boolean {
    return !!(this.publicKey && this.privateKey);
  }

  /** Re-read env vars if not configured at module load (serverless cold start edge case) */
  tryLateConfig(): void {
    if (this.isConfigured()) return;
    const pubKey = process.env.AFFIRM_PUBLIC_KEY || process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
    const privKey = process.env.AFFIRM_PRIVATE_KEY || process.env.AFFIRM_PRIVATE_API_KEY;
    if (pubKey && privKey) {
      this.publicKey = pubKey;
      this.privateKey = privKey;
      const isSandbox = (process.env.AFFIRM_ENVIRONMENT || 'production') === 'sandbox';
      this.transactionsUrl = isSandbox ? SANDBOX_CONFIG.transactionsUrl : AFFIRM_CONFIG.transactionsUrl;
    }
  }

  getPublicKey(): string | undefined {
    return this.publicKey;
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.publicKey}:${this.privateKey}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Authorize a charge using the checkout_token from client-side checkout
   * This is called AFTER customer completes Affirm checkout
   */
  async authorizeCharge(checkoutToken: string, orderId?: string): Promise<AffirmChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('Affirm is not configured. Missing API keys.');
    }

    logger.info('Affirm: Authorizing charge', { checkoutToken: checkoutToken.substring(0, 10) + '...', orderId });

    const response = await fetch(this.transactionsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({
        checkout_token: checkoutToken,
        order_id: orderId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Affirm authorize failed', { status: response.status, error });
      throw new Error(`Affirm authorize failed: ${error}`);
    }

    const charge = await response.json();
    logger.info('Affirm: Charge authorized', { chargeId: charge.id, amount: charge.amount });
    return charge;
  }

  /**
   * Capture an authorized charge
   */
  async captureCharge(chargeId: string, orderId?: string, amount?: number): Promise<AffirmChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('Affirm is not configured. Missing API keys.');
    }

    const body: Record<string, any> = {};
    if (orderId) body.order_id = orderId;
    if (amount) body.amount = amount;

    const response = await fetch(`${this.transactionsUrl}/${chargeId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Affirm capture failed', { status: response.status, error });
      throw new Error(`Affirm capture failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<AffirmChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('Affirm is not configured. Missing API keys.');
    }

    const response = await fetch(`${this.transactionsUrl}/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Affirm get charge failed', { status: response.status, error });
      throw new Error(`Affirm get charge failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Void an authorized charge
   */
  async voidCharge(chargeId: string): Promise<AffirmChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('Affirm is not configured. Missing API keys.');
    }

    const response = await fetch(`${this.transactionsUrl}/${chargeId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Affirm void failed', { status: response.status, error });
      throw new Error(`Affirm void failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refund a captured charge
   */
  async refundCharge(chargeId: string, amount?: number): Promise<AffirmChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error('Affirm is not configured. Missing API keys.');
    }

    const body: Record<string, any> = {};
    if (amount) body.amount = amount;

    const response = await fetch(`${this.transactionsUrl}/${chargeId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Affirm refund failed', { status: response.status, error });
      throw new Error(`Affirm refund failed: ${error}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const affirm = new AffirmClient();

/**
 * Get Affirm checkout configuration for client-side
 * This is used to initialize the Affirm JS SDK
 */
export function getAffirmCheckoutConfig(options: {
  amount: number; // in cents
  orderId: string;
  programName: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  // Read from the singleton instance so tryLateConfig() is reflected here.
  const publicKey = affirm.getPublicKey()
    ?? process.env.AFFIRM_PUBLIC_KEY
    ?? process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY;
  return {
    merchant: {
      public_api_key: publicKey,
      user_confirmation_url: options.successUrl,
      user_cancel_url: options.cancelUrl,
      user_confirmation_url_action: 'GET',
      name: 'Elevate for Humanity',
    },
    shipping: {
      name: {
        full: options.customerName || 'Customer',
      },
      email: options.customerEmail,
      phone_number: options.customerPhone,
    },
    items: [
      {
        display_name: options.programName,
        sku: options.orderId,
        unit_price: options.amount,
        qty: 1,
      },
    ],
    order_id: options.orderId,
    currency: 'USD',
    total: options.amount,
    metadata: {
      platform: 'Elevate for Humanity',
      program: options.programName,
    },
  };
}
