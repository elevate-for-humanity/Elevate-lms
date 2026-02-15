import { createClient } from '@/lib/supabase/server';

/**
 * Enforces legal document requirements before shop can access system
 * Checks MOU, NDA, and Non-Compete are approved
 */
export async function requireLegalClearance(shopId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('shop_required_docs_status')
    .select('document_type, approved')
    .eq('shop_id', shopId);

  if (error) {
    throw new Error(`Failed to check legal clearance`);
  }

  // Critical legal documents that MUST be approved
  const required = ['mou', 'nda', 'non_compete'];
  const missing = required.filter(
    (r) => !data?.find((d) => d.document_type === r && d.approved)
  );

  if (missing.length > 0) {
    const missingNames = missing
      .map((type) => {
        switch (type) {
          case 'mou':
            return 'MOU';
          case 'nda':
            return 'NDA';
          case 'non_compete':
            return 'Non-Compete Agreement';
          default:
            return type;
        }
      })
      .join(', ');

    throw new Error(
      `Legal onboarding incomplete. Missing approved documents: ${missingNames}`
    );
  }

  return true;
}

/**
 * Gets legal clearance status for a shop
 */
export async function getLegalClearanceStatus(shopId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('shop_required_docs_status')
    .select('document_type, display_name, approved, uploaded_at')
    .eq('shop_id', shopId)
    .in('document_type', ['mou', 'nda', 'non_compete']);

  if (error) {
    throw new Error(`Failed to get legal clearance status`);
  }

  const required = ['mou', 'nda', 'non_compete'];
  const approved = data?.filter((d) => d.approved) || [];
  const pending = required.filter(
    (r) => !data?.find((d) => d.document_type === r && d.approved)
  );

  return {
    cleared: pending.length === 0,
    approved: approved.length,
    pending: pending.length,
    documents: data || [],
    missingDocuments: pending,
  };
}
