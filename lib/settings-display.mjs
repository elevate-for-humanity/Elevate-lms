// Only explicitly public scalar settings may be rendered in the Admin overview.
// Unknown keys fail closed, including legacy credentials with unconventional names.
const PUBLIC_SETTINGS = new Set([
  'site_name', 'support_email', 'contact_phone', 'timezone',
  'email_notifications', 'sms_notifications', 'system_alerts',
  'mfa_required', 'session_timeout', 'currency', 'stripe_mode',
  'stripe_billing_mode', 'payment_methods', 'payment_processor', 'billing_provider',
  'email_from_name', 'email_from_address', 'email_provider',
  'affirm_enabled', 'afterpay_enabled', 'bnpl_enabled', 'klarna_enabled', 'sezzle_enabled',
]);
export function platformSettingDisplayValue(key, value) {
  if (value === null || value === undefined) return '—';
  if (!PUBLIC_SETTINGS.has(key) || !['string', 'number', 'boolean'].includes(typeof value)) {
    return value === '' ? '' : '••••••••';
  }
  return String(value);
}
