// Dead-end path — redirects to the real program manager.
// The old /admin/programs/builder had a form with no submit handler.
import { redirect } from 'next/navigation';

export default function OldProgramBuilderRedirect() {
  redirect('/admin/programs');
}
