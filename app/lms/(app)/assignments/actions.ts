'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitAssignment(formData: FormData) {
  // Use session client — RLS enforces row ownership. Admin client not needed here.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const assignmentId = formData.get('assignment_id') as string;
  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  if (!assignmentId) {
    return { error: 'Assignment ID is required' };
  }

  let fileUrl = null;

  // Handle file upload if provided
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${assignmentId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(fileName, file);

    if (uploadError) {
      return { error: `File upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(fileName);

    fileUrl = publicUrl;
  }

  // Save submission to database
  const { error } = await supabase
    .from('assignment_submissions')
    .upsert({
      user_id: user.id,
      assignment_id: assignmentId,
      content: content || null,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    }, {
      onConflict: 'user_id,assignment_id',
    });

  if (error) {
    return { error: `Submission failed: ${error.message}` };
  }

  revalidatePath('/lms/assignments');
  return { success: true, message: 'Assignment submitted successfully!' };
}
