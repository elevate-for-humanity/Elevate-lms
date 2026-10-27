import 'server-only';
import { createHash } from 'node:crypto';
import { assertQuickBooksProductionEnvironment, loadQuickBooksConfig, quickBooksRequest } from './quickbooks-client';

export const holderVendorKey = (id: string) => `QB_PROGRAM_HOLDER_VENDOR_${id}`;
const eligibleStatuses = ['approved', 'active', 'approved_pending_mou'];

/** Creates accounting identity only: no invitation, bank verification or payment. */
export async function ensureProgramHolderQuickBooksContractor(db: any, holderId: string) {
  const { data: holder, error: holderError } = await db.from('program_holders')
    .select('id,name,organization_name,contact_email,status,user_id,features').eq('id', holderId).maybeSingle();
  if (holderError || !holder) throw new Error('Program Holder could not be loaded.');
  const name = String(holder.organization_name || holder.name || '').trim();
  if (!eligibleStatuses.includes(holder.status) || !name || /^\[(QA|TEST)\b/i.test(name) || holder.features?.is_test === true) {
    return { linked: false, reason: 'Program Holder is not eligible for contractor provisioning.' };
  }
  let email = String(holder.contact_email || '').trim().toLowerCase();
  if (!email && holder.user_id) {
    const { data, error } = await db.from('profiles').select('email').eq('id', holder.user_id).maybeSingle();
    if (error) throw new Error('Program Holder contact could not be loaded.');
    email = String(data?.email || '').trim().toLowerCase();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /\.invalid$/i.test(email)) return { linked: false, reason: 'A valid business contact email is required.' };
  const config = await loadQuickBooksConfig(db);
  assertQuickBooksProductionEnvironment();
  if (!config.realmId) throw new Error('QuickBooks company is not connected.');
  const key = holderVendorKey(holderId);
  const { data: saved, error: mappingError } = await db.from('app_settings').select('value').eq('key', key).maybeSingle();
  if (mappingError) throw new Error('QuickBooks contractor mapping could not be loaded.');
  let mapping: any;
  try { mapping = JSON.parse(saved?.value || 'null'); } catch { mapping = null; }
  if (mapping?.realmId === config.realmId && mapping?.vendorId) return { linked: true, vendorId: String(mapping.vendorId) };
  const escaped = name.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
  const result = await quickBooksRequest(db, config, `query?query=${encodeURIComponent(`select * from Vendor where DisplayName = '${escaped}' maxresults 2`)}`);
  const vendors = result.QueryResponse?.Vendor || [];
  if (vendors.length > 1) throw new Error('Multiple QuickBooks vendors match this holder. Review the contractor.');
  let vendor = vendors[0];
  if (vendor && String(vendor.PrimaryEmailAddr?.Address || '').toLowerCase() !== email) throw new Error('QuickBooks vendor contact does not match this holder. Review the contractor.');
  const reference = createHash('sha256').update(`${config.realmId}|${holderId}`).digest('hex').slice(0, 32);
  if (!vendor) {
    const created = await quickBooksRequest(db, config, `vendor?requestid=efh-holder-${reference}`, { method: 'POST', body: JSON.stringify({ DisplayName: name, CompanyName: name, PrimaryEmailAddr: { Address: email }, Vendor1099: true }) });
    vendor = created.Vendor;
  } else if (vendor.Vendor1099 !== true) {
    if (!vendor.Id || vendor.SyncToken === undefined) throw new Error('QuickBooks vendor revision could not be verified.');
    const updated = await quickBooksRequest(db, config, `vendor?requestid=efh-holder-${reference}-${vendor.SyncToken}`, { method: 'POST', body: JSON.stringify({ Id: vendor.Id, SyncToken: vendor.SyncToken, sparse: true, Vendor1099: true }) });
    vendor = updated.Vendor;
  }
  if (!vendor?.Id || vendor.Vendor1099 !== true) throw new Error('QuickBooks contractor creation could not be verified.');
  const { error } = await db.from('app_settings').upsert({ key, value: JSON.stringify({ realmId: config.realmId, vendorId: String(vendor.Id) }), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw new Error('QuickBooks contractor exists but its link could not be saved. Retry to reconcile.');
  return { linked: true, vendorId: String(vendor.Id) };
}
