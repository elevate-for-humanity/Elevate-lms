import { createClient } from '@/lib/supabase/server';

/**
 * Checks if a shop has completed all required onboarding documents
 * Throws error if any required documents are missing or not approved
 */
export async function requireShopOnboardingComplete(shopId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('shop_required_docs_status')
    .select('document_type, display_name, required, approved')
    .eq('shop_id', shopId);

  if (error) {
    throw new Error(`Failed to check shop onboarding`);
  }

  const missing = (data || []).filter((d) => d.required && !d.approved);

  if (missing.length > 0) {
    const list = missing.map((m) => m.display_name).join(', ');
    throw new Error(
      `Shop onboarding not complete. Missing or not approved: ${list}`
    );
  }

  return true;
}

/**
 * Gets onboarding completion status for a shop
 * Returns summary of required vs completed documents
 */
export async function getShopOnboardingStatus(shopId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('shop_required_docs_status')
    .select('*')
    .eq('shop_id', shopId);

  if (error) {
    throw new Error(`Failed to get shop onboarding status`);
  }

  const required = data?.filter((d) => d.required) || [];
  const approved = required.filter((d) => d.approved);
  const pending = required.filter((d) => !d.approved);

  return {
    total: required.length,
    approved: approved.length,
    pending: pending.length,
    complete: pending.length === 0,
    documents: data || [],
    missingDocuments: pending.map((d) => ({
      type: d.document_type,
      name: d.display_name,
      description: d.description,
    })),
  };
}
