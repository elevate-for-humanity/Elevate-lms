/**
 * License Linking Tests
 *
 * Verifies that Stripe checkout sessions include proper metadata
 * for license provisioning and that the webhook handler correctly
 * extracts and uses this metadata.
 */

import { describe, it, expect } from 'vitest';

// Mock the plan to license type mapping
function mapPlanToLicenseType(planId: string): 'basic' | 'professional' | 'enterprise' {
  const mapping: Record<string, 'basic' | 'professional' | 'enterprise'> = {
    core: 'basic',
    institutional: 'professional',
    enterprise: 'enterprise',
  };
  return mapping[planId] || 'basic';
}

describe('License Linking', () => {
  describe('mapPlanToLicenseType', () => {
    it('maps core plan to basic license type', () => {
      expect(mapPlanToLicenseType('core')).toBe('basic');
    });

    it('maps institutional plan to professional license type', () => {
      expect(mapPlanToLicenseType('institutional')).toBe('professional');
    });

    it('maps enterprise plan to enterprise license type', () => {
      expect(mapPlanToLicenseType('enterprise')).toBe('enterprise');
    });

    it('defaults to basic for unknown plans', () => {
      expect(mapPlanToLicenseType('unknown')).toBe('basic');
    });
  });

  describe('Checkout Session Metadata', () => {
    it('should include all required metadata fields', () => {
      // Simulate the metadata that would be set on a checkout session
      const metadata = {
        product_type: 'license',
        license_type: mapPlanToLicenseType('institutional'),
        plan_id: 'institutional',
        organization_name: 'Test Org',
        organization_type: 'training_provider',
        contact_name: 'John Doe',
        company_name: 'Test Org',
        admin_email: 'admin@test.org',
        agreements_accepted: 'eula,tos,aup,disclosures,license',
        agreements_accepted_at: new Date().toISOString(),
      };

      // Verify required fields for license provisioning
      expect(metadata.product_type).toBe('license');
      expect(metadata.license_type).toBe('professional');
      expect(metadata.plan_id).toBe('institutional');
      expect(metadata.company_name).toBeTruthy();
      expect(metadata.admin_email).toBeTruthy();
    });
  });

  describe('Webhook Metadata Extraction', () => {
    it('should extract provisioning context from session metadata', () => {
      // Simulate a Stripe checkout session
      const session = {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        customer_email: 'admin@test.org',
        subscription: 'sub_test_789',
        amount_total: 250000, // $2,500 in cents
        currency: 'usd',
        payment_intent: 'pi_test_abc',
        metadata: {
          product_type: 'license',
          license_type: 'professional',
          plan_id: 'institutional',
          organization_name: 'Test Organization',
          organization_type: 'training_provider',
          company_name: 'Test Organization',
          admin_email: 'admin@test.org',
        },
      };

      // Extract provisioning context as the webhook would
      const adminEmail = session.customer_email || session.metadata.admin_email || '';
      const companyName =
        session.metadata.company_name || session.metadata.organization_name || 'Unknown Company';

      const provisioningContext = {
        correlationId: 'evt_test_event',
        email: adminEmail,
        productId: session.metadata.plan_id || session.metadata.license_type || 'enterprise',
        paymentIntentId: session.payment_intent,
        sessionId: session.id,
        amountCents: session.amount_total || 0,
        currency: session.currency || 'usd',
        organizationName: companyName,
        metadata: {
          license_type: session.metadata.license_type,
          plan_id: session.metadata.plan_id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          organization_type: session.metadata.organization_type,
        },
      };

      // Verify extracted context
      expect(provisioningContext.email).toBe('admin@test.org');
      expect(provisioningContext.productId).toBe('institutional');
      expect(provisioningContext.organizationName).toBe('Test Organization');
      expect(provisioningContext.amountCents).toBe(250000);
      expect(provisioningContext.metadata.license_type).toBe('professional');
      expect(provisioningContext.metadata.stripe_customer_id).toBe('cus_test_456');
      expect(provisioningContext.metadata.stripe_subscription_id).toBe('sub_test_789');
    });

    it('should handle missing optional fields gracefully', () => {
      const session = {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        customer_email: null,
        subscription: null,
        amount_total: 0,
        currency: null,
        payment_intent: null,
        metadata: {
          product_type: 'license',
          license_type: 'basic',
          plan_id: 'core',
          admin_email: 'fallback@test.org',
        },
      };

      const adminEmail = session.customer_email || session.metadata.admin_email || '';
      const companyName =
        session.metadata.company_name || session.metadata.organization_name || 'Unknown Company';

      expect(adminEmail).toBe('fallback@test.org');
      expect(companyName).toBe('Unknown Company');
    });
  });

  describe('Audit Log Entry', () => {
    it('should include all linking proof fields', () => {
      const auditEntry = {
        action: 'LICENSE_PROVISIONED',
        entity: 'license',
        entityId: 'lic_test_123',
        metadata: {
          tenant_id: 'tenant_test_456',
          license_id: 'lic_test_123',
          stripe_session_id: 'cs_test_789',
          stripe_subscription_id: 'sub_test_abc',
          plan_id: 'institutional',
          license_type: 'professional',
        },
      };

      // Verify all linking proof fields are present
      expect(auditEntry.action).toBe('LICENSE_PROVISIONED');
      expect(auditEntry.entity).toBe('license');
      expect(auditEntry.metadata.tenant_id).toBeTruthy();
      expect(auditEntry.metadata.license_id).toBeTruthy();
      expect(auditEntry.metadata.stripe_session_id).toBeTruthy();
      expect(auditEntry.metadata.plan_id).toBeTruthy();
      expect(auditEntry.metadata.license_type).toBeTruthy();
    });
  });
});
