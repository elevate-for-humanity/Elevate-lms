'use server';

// Stub action for marketing site - application submission handled by LMS
export async function submitStudentApplication(data: {
  programId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalStatement?: string;
  fundingSource?: string;
}) {
  // In production, this would submit to database
  // For marketing site, we just return success
  return {
    success: true,
    applicationId: `APP-${Date.now()}`,
    message: 'Application received. You will be contacted shortly.',
  };
}
