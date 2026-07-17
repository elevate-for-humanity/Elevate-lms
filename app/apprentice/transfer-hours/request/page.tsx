import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Transfer Hours Request | Apprentice',
  description: 'Request to transfer hours.',
};

export default function TransferHoursRequestPage() {
  redirect('/apprentice/transfer-hours');
}
