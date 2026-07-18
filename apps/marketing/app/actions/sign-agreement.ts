'use server';

// Stub action for marketing site - signature recording handled by LMS
export async function signAgreement(data: {
  agreementType: string;
  agreementVersion: string;
  method: 'checkbox' | 'typed' | 'drawn';
  signature?: string;
  typedName?: string;
  studentId?: string;
}) {
  // In production, this would record the signature
  // For marketing site, we just return success
  return {
    success: true,
    message: 'Agreement acknowledged',
    timestamp: new Date().toISOString(),
  };
}
