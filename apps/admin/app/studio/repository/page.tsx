import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StudioRepositoryPage() {
  redirect('/studio?tab=files');
}
