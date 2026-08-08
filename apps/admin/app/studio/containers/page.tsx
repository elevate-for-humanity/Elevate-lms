import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StudioContainersPage() {
  redirect('/studio?tab=containers');
}
