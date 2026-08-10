import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function NewApprenticePage() {
  redirect('/host-shop/dashboard/match-requests');
}
