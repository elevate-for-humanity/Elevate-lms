export type RuntimeIntegration = {
  id: string;
  required: readonly string[];
  webhook?: boolean;
};

/**
 * Canonical runtime requirements used by every Admin status surface.
 * A configured result proves only that required configuration is present;
 * provider reachability and webhook activity are reported separately.
 */
export const RUNTIME_INTEGRATIONS: readonly RuntimeIntegration[] = [
  {
    id: 'stripe',
    required: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    webhook: true,
  },
  {
    id: 'sezzle',
    required: [
      'SEZZLE_MERCHANT_ID',
      'SEZZLE_PUBLIC_KEY',
      'SEZZLE_PRIVATE_KEY',
      'SEZZLE_WEBHOOK_SECRET',
    ],
    webhook: true,
  },
  {
    id: 'affirm',
    required: ['AFFIRM_PUBLIC_KEY', 'AFFIRM_PRIVATE_KEY', 'AFFIRM_WEBHOOK_SECRET'],
    webhook: true,
  },
  { id: 'jotform', required: ['JOTFORM_API_KEY', 'JOTFORM_WEBHOOK_SECRET'], webhook: true },
  { id: 'calendly', required: ['CALENDLY_API_TOKEN', 'CALENDLY_WEBHOOK_SECRET'], webhook: true },
  { id: 'resend', required: ['RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET'], webhook: true },
  { id: 'sendgrid-inbound', required: ['SENDGRID_API_KEY'], webhook: true },
  { id: 'supabase', required: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { id: 'quickbooks', required: ['QB_CLIENT_ID', 'QB_CLIENT_SECRET'] },
  { id: 'google', required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
  { id: 'teams', required: ['TEAMS_WEBHOOK_URL'], webhook: true },
  { id: 'zoom', required: ['ZOOM_ACCOUNT_ID', 'ZOOM_CLIENT_ID', 'ZOOM_CLIENT_SECRET'] },
] as const;

export function runtimeRequirementPresent(name: string): boolean {
  if (name === 'AFFIRM_PRIVATE_KEY') {
    return Boolean(process.env.AFFIRM_PRIVATE_KEY || process.env.AFFIRM_PRIVATE_API_KEY);
  }
  if (name === 'SEZZLE_MERCHANT_ID') {
    return Boolean(process.env.SEZZLE_MERCHANT_ID || process.env.NEXT_PUBLIC_SEZZLE_MERCHANT_ID);
  }
  return Boolean(process.env[name]);
}

export function runtimeConfiguration(id: string) {
  const integration = RUNTIME_INTEGRATIONS.find((item) => item.id === id);
  if (!integration) return { configured: false, partial: false, present: 0, required: 0 };
  const present = integration.required.filter(runtimeRequirementPresent).length;
  return {
    configured: present === integration.required.length,
    partial: present > 0 && present < integration.required.length,
    present,
    required: integration.required.length,
  };
}
