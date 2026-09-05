export const HVAC_PROGRAM_HOLDER_REQUIRED_DOCUMENTS = [
  { type: 'government_id', label: 'Government-issued photo ID' },
  { type: 'business_registration', label: 'Business registration for the contracting entity' },
  { type: 'insurance', label: 'Current general liability insurance certificate' },
  { type: 'epa_608', label: 'EPA Section 608 technician certification' },
  { type: 'w9', label: 'Completed IRS Form W-9' },
  { type: 'hvac_training_plan', label: 'Approved HVAC syllabus and training plan' },
  { type: 'profile_photo', label: 'Program Holder profile picture' },
  { type: 'student_photo', label: 'Student training photos' },
  { type: 'student_video', label: 'Student training videos' },
] as const;

export type ProgramHolderReadiness = {
  ready: boolean;
  missing: string[];
  mouSigned: boolean;
  handbookAcknowledged: boolean;
  rightsAcknowledged: boolean;
};

export async function getStudentPaymentReadiness(db: any, enrollmentId: string) {
  const { data: student } = await db
    .from('program_enrollments')
    .select(
      'full_name,status,enrollment_state,training_start_date,training_end_date,progress_percent,total_hours_completed,lms_completed,practical_skills_verified,certificate_issued_at',
    )
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!student) return { ready: false, missing: ['Student enrollment record'] };
  const name = student.full_name || 'Student';
  const missing = [
    ...(!['completed', 'graduated'].includes(String(student.status))
      ? [`${name}: graduation closeout`]
      : []),
    ...(!student.training_start_date ? [`${name}: training start date`] : []),
    ...(!student.training_end_date ? [`${name}: training end date`] : []),
    ...(Number(student.progress_percent || 0) < 100 ? [`${name}: final progress`] : []),
    ...(Number(student.total_hours_completed || 0) < 48
      ? [`${name}: 48 completed WorkOne training hours`]
      : []),
    ...(!student.lms_completed ? [`${name}: coursework completion verification`] : []),
    ...(!student.practical_skills_verified ? [`${name}: practical skills verification`] : []),
    ...(!student.certificate_issued_at ? [`${name}: certificate receipt date`] : []),
  ];
  return { ready: missing.length === 0, missing };
}

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
