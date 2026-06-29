'use server';

export async function submitStudentApplication(formData: {
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
  console.log('submitStudentApplication called:', formData);
  return { success: true, message: 'Application submitted successfully' };
}
