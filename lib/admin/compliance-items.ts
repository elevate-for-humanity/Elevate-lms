export type ComplianceEvidenceRow = {
  id: string;
  item_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
};

export type ComplianceItemRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  description: string | null;
  last_reviewed_at: string | null;
};

export function attachComplianceEvidence(
  items: ComplianceItemRow[],
  evidence: ComplianceEvidenceRow[],
) {
  const evidenceByItem = new Map<string, ComplianceEvidenceRow[]>();
  for (const row of evidence) {
    const current = evidenceByItem.get(row.item_id) ?? [];
    current.push(row);
    evidenceByItem.set(row.item_id, current);
  }
  return items.map((item) => ({
    ...item,
    compliance_evidence: (evidenceByItem.get(item.id) ?? []).map((row) => ({
      id: row.id,
      file_url: row.file_url,
      file_name: row.file_name,
      uploaded_at: row.created_at,
    })),
  }));
}
