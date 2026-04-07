import { redirect } from 'next/navigation';

// Superseded by /admin/courses/generate — redirect permanently
export default function CourseGeneratorRedirect() {
  redirect('/admin/courses/generate');
}
