import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StudioCfdPage() {
  redirect('/studio?tab=cfd');
}
