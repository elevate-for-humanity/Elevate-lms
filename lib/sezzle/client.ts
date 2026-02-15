import { logger } from '@/lib/logger';
/**
 * Sezzle BNPL Integration - V2 API
 * 
 * Sezzle allows customers to split purchases into 4 interest-free payments.
 * API Documentation: https://docs.sezzle.com/
 * 
 * Flow:
 * 1. Create session with order details
 * 2. Redirect customer to checkout_url
 * 3. Customer completes checkout
 * 4. Capture funds (if intent=AUTH) or auto-captured (if intent=CAPTURE)
 * 5. Handle webhooks for order updates
 */

const SEZZLE_SANDBOX_URL = 'https://sandbox.gateway.sezzle.com';
const SEZZLE_PRODUCTION_URL = 'https://gateway.sezzle.com';

export interface SezzleConfig {
  publicKey: string;
  privateKey: string;
  environment: 'sandbox' | 'production';
}

export interface SezzlePrice {
  amount_in_cents: number;
  currency: string;
}

export interface SezzleAddress {
  name?: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
  phone_number?: string;
}

export interface SezzleCustomer {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string; // YYYY-MM-DD
  billing_address?: SezzleAddress;
  shipping_address?: SezzleAddress;
}

export interface SezzleLineItem {
  name: string;
  sku?: string;
  quantity: number;
  price: SezzlePrice;
}

export interface SezzleDiscount {
  name: string;
  amount: SezzlePrice;
}

export interface SezzleOrder {
  intent: 'AUTH' | 'CAPTURE';
  reference_id: string;
  description?: string;
  order_amount: SezzlePrice;
  items?: SezzleLineItem[];
  discounts?: SezzleDiscount[];
  tax_amount?: SezzlePrice;
  shipping_amount?: SezzlePrice;
  metadata?: Record<string, string>;
}

export interface SezzleSessionRequest {
  cancel_url: {
    href: string;
    method?: string;
  };
  complete_url: {
    href: string;
    method?: string;
  };
  customer?: SezzleCustomer;
  order: SezzleOrder;
}

export interface SezzleLink {
  href: string;
  rel: string;
  method: string;
}

export interface SezzleSessionResponse {
  uuid: string;
  links: SezzleLink[];
  order: {
    uuid: string;
    checkout_url: string;
    intent: string;
    links: SezzleLink[];
  };
  tokenize?: {
    token: string;
    expiration: string;
    approval_url: string;
  };
}

export interface SezzleOrderResponse {
  uuid: string;
  reference_id: string;
  intent: string;
  authorization: {
    approved: boolean;
    amount: SezzlePrice;
    expiration: string;
  };
  capture: {
    captured: boolean;
    amount: SezzlePrice;
  };
  refund: {
    refunded: boolean;
    amount: SezzlePrice;
  };
  customer: SezzleCustomer;
  order_amount: SezzlePrice;
  links: SezzleLink[];
}

export interface SezzleAuthResponse {
  token: string;
  expiration_date: string;
  merchant_uuid: string;
}

class SezzleClient {
  private config: SezzleConfig | null = null;
  private authToken: string | null = null;
  private tokenExpiration: Date | null = null;

  /** Safely parse JSON — some Sezzle endpoints return empty 200 responses */
  private async safeJson(response: Response): Promise<any> {
    const text = await response.text();
    if (!text || text.trim() === '') return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  private getBaseUrl(): string {
    if (!this.config) throw new Error('Sezzle not configured');
    return this.config.environment === 'production' 
      ? SEZZLE_PRODUCTION_URL 
      : SEZZLE_SANDBOX_URL;
  }

  configure(config: SezzleConfig) {
    this.config = config;
  }

  isConfigured(): boolean {
    return !!(this.config?.publicKey && this.config?.privateKey);
  }

  /**
   * Get authentication token
   * POST /v2/authentication
   */
  private async authenticate(): Promise<string> {
    if (!this.config) {
      throw new Error('Sezzle not configured. Set SEZZLE_PUBLIC_KEY and SEZZLE_PRIVATE_KEY.');
    }

    // Return cached token if still valid (with 5 min buffer)
    if (this.authToken && this.tokenExpiration) {
      const bufferTime = new Date(Date.now() + 5 * 60 * 1000);
      if (bufferTime < this.tokenExpiration) {
        return this.authToken;
      }
    }

    const response = await fetch(`${this.getBaseUrl()}/v2/authentication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_key: this.config.publicKey,
        private_key: this.config.privateKey,
      }),
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle authentication failed`);
    }

    const data: SezzleAuthResponse = await response.json();
    this.authToken = data.token;
    this.tokenExpiration = new Date(data.expiration_date);

    return this.authToken;
  }

  /**
   * Create a checkout session
   * POST /v2/session
   */
  async createSession(request: SezzleSessionRequest): Promise<SezzleSessionResponse> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sezzle session creation failed`);
    }

    return response.json();
  }

  /**
   * Get session status
   * GET /v2/session/{session_uuid}
   */
  async getSession(sessionUuid: string): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/session/${sessionUuid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sezzle get session failed`);
    }

    return response.json();
  }

  /**
   * Get order details
   * GET /v2/order/{order_uuid}
   */
  async getOrder(orderUuid: string): Promise<SezzleOrderResponse> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Sezzle get order failed`);
    }

    return response.json();
  }

  /**
   * Capture amount by order
   * POST /v2/order/{order_uuid}/capture
   * Use after customer completes checkout if intent was AUTH
   */
  async captureOrder(orderUuid: string, amountInCents?: number, partialCapture: boolean = false): Promise<any> {
    const token = await this.authenticate();

    const body: any = {
      partial_capture: partialCapture,
    };
    
    if (amountInCents !== undefined) {
      body.capture_amount = {
        amount_in_cents: amountInCents,
        currency: 'USD',
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle capture failed`);
    }

    return this.safeJson(response);
  }

  /**
   * Refund amount by order
   * POST /v2/order/{order_uuid}/refund
   */
  async refundOrder(orderUuid: string, amountInCents: number): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: {
          amount_in_cents: amountInCents,
          currency: 'USD',
        },
      }),
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle refund failed`);
    }

    return this.safeJson(response);
  }

  /**
   * Release amount by order (for partial fulfillment)
   * POST /v2/order/{order_uuid}/release
   */
  async releaseOrder(orderUuid: string, amountInCents: number): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: {
          amount_in_cents: amountInCents,
          currency: 'USD',
        },
      }),
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle release failed`);
    }

    return this.safeJson(response);
  }

  /**
   * Update order with merchant reference ID
   * PATCH /v2/order/{order_uuid}
   */
  async updateOrder(orderUuid: string, referenceId: string): Promise<any> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        reference_id: referenceId,
      }),
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle update order failed`);
    }

    return this.safeJson(response);
  }

  /**
   * Delete checkout by order (cancel incomplete checkout)
   * DELETE /v2/order/{order_uuid}/checkout
   */
  async deleteCheckout(orderUuid: string): Promise<void> {
    const token = await this.authenticate();

    const response = await fetch(`${this.getBaseUrl()}/v2/order/${orderUuid}/checkout`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await this.safeJson(response);
      throw new Error(`Sezzle delete checkout failed`);
    }
  }
}

// Singleton instance
export const sezzle = new SezzleClient();

// Auto-configure if environment variables are set
if (process.env.SEZZLE_PUBLIC_KEY && process.env.SEZZLE_PRIVATE_KEY) {
  sezzle.configure({
    publicKey: process.env.SEZZLE_PUBLIC_KEY,
    privateKey: process.env.SEZZLE_PRIVATE_KEY,
    environment: (process.env.SEZZLE_ENVIRONMENT as 'sandbox' | 'production') || 'production',
  });
} else {
  // Log which vars are missing to help diagnose Netlify config issues
  if (typeof process !== 'undefined' && process.env) {
    const missing = [];
    if (!process.env.SEZZLE_PUBLIC_KEY) missing.push('SEZZLE_PUBLIC_KEY');
    if (!process.env.SEZZLE_PRIVATE_KEY) missing.push('SEZZLE_PRIVATE_KEY');
    logger.warn(`[Sezzle] Not configured - missing env vars: ${missing.join(', ')}`);
  }
}
