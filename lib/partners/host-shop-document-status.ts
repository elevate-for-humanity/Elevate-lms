import {
  mergeHostShopDocumentRequirements,
  type HostShopProgramType,
} from './host-shop-onboarding';

const ACCEPTED = new Set(['accepted', 'approved', 'verified', 'complete', 'completed']);

export function hostShopStateAliases(state: string | null | undefined) {
  const value = String(state || 'Indiana').trim();
  return [...new Set([value, ...(/^(in|indiana)$/i.test(value) ? ['IN', 'Indiana'] : []), 'ALL'])];
}

/** Shared by the admin directory and every Host Shop workspace. */
export function resolveHostShopDocuments(
  program: HostShopProgramType,
  state: string | null | undefined,
  requirementRows: Array<Record<string, any>>,
  documents: Array<Record<string, any>>,
  today = new Date().toISOString().slice(0, 10),
) {
  const states = hostShopStateAliases(state);
  const requirements = mergeHostShopDocumentRequirements(
    requirementRows.filter(
      (row) => ['ALL', program].includes(row.program_id) && states.includes(row.state),
    ),
    program,
  );
  const latest = new Map<string, Record<string, any>>();
  for (const doc of [...documents].sort((a, b) =>
    String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')),
  )) {
    if (!latest.has(doc.document_type)) latest.set(doc.document_type, doc);
  }
  return requirements.map((requirement) => {
    const document = latest.get(String(requirement.document_type));
    const raw = String(document?.status || 'missing')
      .trim()
      .toLowerCase();
    const expired =
      document?.expiration_date && String(document.expiration_date).slice(0, 10) < today;
    const status = expired ? 'expired' : ACCEPTED.has(raw) ? 'accepted' : raw;
    return {
      ...requirement,
      document_type: String(requirement.document_type),
      document_name: String(requirement.document_name || requirement.document_type),
      description: String(requirement.description || ''),
      is_required: requirement.is_required === true,
      program_id: String(requirement.program_id || program),
      state: String(requirement.state || state || 'Indiana'),
      uploaded: Boolean(document),
      document: document ? { ...document, id: String(document.id) } : null,
      status,
    };
  });
}
