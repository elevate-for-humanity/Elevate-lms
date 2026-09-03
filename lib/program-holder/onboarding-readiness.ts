export const HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS = [
  { type: 'government_id', label: 'Government-issued photo ID' },
  { type: 'business_registration', label: 'Business registration for the contracting entity' },
  { type: 'insurance', label: 'Current general liability insurance certificate' },
  { type: 'epa_608', label: 'EPA Section 608 technician certification' },
  { type: 'w9', label: 'Completed IRS Form W-9' },
  { type: 'hvac_training_plan', label: 'Approved HVAC syllabus and training plan' },
] as const;

export type ProgramHolderReadiness = {
  ready: boolean;
  missing: string[];
  mouSigned: boolean;
  handbookAcknowledged: boolean;
  rightsAcknowledged: boolean;
};

export async function getProgramHolderPaymentReadiness(
  db: any,
  holderId: string,
): Promise<ProgramHolderReadiness> {
  const { data: holder } = await db
    .from('program_holders')
    .select('user_id,mou_signed,mou_status,mou_type')
    .eq('id', holderId)
    .maybeSingle();

  if (!holder?.user_id) {
    return {
      ready: false,
      missing: ['Program Holder record'],
      mouSigned: false,
      handbookAcknowledged: false,
      rightsAcknowledged: false,
    };
  }

  const [{ data: acknowledgements }, { data: documents }] = await Promise.all([
    db
      .from('program_holder_acknowledgements')
      .select('document_type')
      .eq('user_id', holder.user_id),
    db
      .from('program_holder_documents')
      .select('document_type,status,approved')
      .eq('user_id', holder.user_id),
  ]);

  const approvedTypes = new Set(
    (documents || [])
      .filter((document: any) => document.status === 'approved' || document.approved === true)
      .map((document: any) => String(document.document_type)),
  );
  const acknowledgedTypes = new Set(
    (acknowledgements || []).map((item: any) => String(item.document_type)),
  );
  const mouSigned =
    holder.mou_signed === true &&
    ['signed', 'fully_executed'].includes(String(holder.mou_status || 'signed'));
  const handbookAcknowledged = acknowledgedTypes.has('handbook');
  const rightsAcknowledged = acknowledgedTypes.has('rights');
  const required = String(holder.mou_type || '').includes('hvac')
    ? HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS
    : [
        { type: 'syllabus', label: 'Syllabus' },
        { type: 'business_license', label: 'Business license' },
        { type: 'insurance', label: 'Insurance certificate' },
      ];
  const missing = [
    ...(!mouSigned ? ['Signed current Program Holder MOU'] : []),
    ...(!handbookAcknowledged ? ['Program Holder handbook acknowledgement'] : []),
    ...(!rightsAcknowledged ? ['Rights and responsibilities acknowledgement'] : []),
    ...required.filter((item) => !approvedTypes.has(item.type)).map((item) => item.label),
  ];

  return {
    ready: missing.length === 0,
    missing,
    mouSigned,
    handbookAcknowledged,
    rightsAcknowledged,
  };
}
