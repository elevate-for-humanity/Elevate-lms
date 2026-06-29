'use server';

export async function submitStudentApplication(_formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode: string;
  requestedFundingSource: string;
  goals: string;
  programSlug?: string;
  programTitle?: string;
}): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual application submission logic
  return { success: true, message: 'Application submitted successfully' };
}
