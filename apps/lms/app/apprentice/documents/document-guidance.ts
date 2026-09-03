type DocumentRequirement = {
  document_type?: string | null;
  name?: string | null;
  description?: string | null;
};

export function getDocumentUploadGuidance(requirement: DocumentRequirement): string | null {
  if (requirement.description?.trim()) return requirement.description.trim();

  const key = `${requirement.document_type ?? ''} ${requirement.name ?? ''}`.toLowerCase();
  if (key.includes('address') || key.includes('residen')) {
    return 'Upload one recent document showing your full name and current home address: a utility bill, signed lease or rental agreement, bank statement, government benefits letter, or other official government mail. Use a document dated within the last 90 days when possible, and make sure the name, address, date, and full page are readable.';
  }

  return null;
}
