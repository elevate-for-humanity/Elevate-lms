'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createCourseAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const course_name = (formData.get('course_name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const category = (formData.get('category') as string) || null;
  const duration_hours = parseInt(formData.get('duration_hours') as string) || null;
  const price = parseFloat(formData.get('price') as string) || 0;

  if (!course_name) return;

  const { data: course } = await supabase
    .from('lms_courses')
    .insert({
      course_name,
      description,
      category,
      duration_hours,
      price,
      instructor_id: user.id,
      is_active: true,
    })
    .select('id')
    .single();

  redirect(course?.id ? `/lms/courses/${course.id}` : '/lms/dashboard');
}
