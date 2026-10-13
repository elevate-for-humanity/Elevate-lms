/** Resolve the configured sender, or the existing active platform provider
 * number. Never substitute a contact-page number or select a tenant's line. */
export async function resolveSendingNumber(db: any, env: Record<string, string | undefined> = process.env): Promise<string | null> {
  const configured = env.TELNYX_PHONE_NUMBER?.trim();
  if (configured) return /^\+[1-9]\d{7,14}$/.test(configured) ? configured : null;
  const { data: system, error: systemError } = await db.from('phone_systems').select('id').is('tenant_id', null).maybeSingle();
  if (systemError || !system?.id) return null;
  const { data: number, error } = await db.from('phone_numbers').select('e164').eq('phone_system_id', system.id).eq('source', 'provider').eq('is_primary', true).eq('status', 'active').maybeSingle();
  if (error || !/^\+[1-9]\d{7,14}$/.test(number?.e164 ?? '')) return null;
  return number.e164;
}
