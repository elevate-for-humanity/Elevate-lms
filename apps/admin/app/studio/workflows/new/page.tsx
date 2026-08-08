import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function NewWorkflowPage() {
  redirect('/studio/workflows');
}
