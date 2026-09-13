import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default function TasksPage() {
  redirect('/studio?workspace=tasks');
}
