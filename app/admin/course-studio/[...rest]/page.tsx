import { redirect } from 'next/navigation';

export default function CourseStudioCatchAll() {
  redirect('/admin/course-builder');
}
