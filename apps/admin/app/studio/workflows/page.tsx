import { redirect } from 'next/navigation';

export default function WorkflowsPage() {
  redirect('/studio?workspace=workflows');
}
