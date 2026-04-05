import { redirect } from 'next/navigation';

// The program builder lives at /admin/programs/new (uses ProgramForm with full submit handler)
export default function ProgramBuilderPage() {
  redirect('/admin/programs/new');
}
