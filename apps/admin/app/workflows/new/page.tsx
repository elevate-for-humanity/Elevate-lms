import { redirect } from 'next/navigation';

// /admin/workflows/new redirects to the list page where the create form lives
export default function Page() {
  redirect('/admin/workflows');
}
