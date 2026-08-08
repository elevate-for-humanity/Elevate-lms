import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function NewWorkflowCompatibilityPage() {
  redirect('/admin/studio/workflows');
}
