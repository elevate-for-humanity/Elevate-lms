export const metadata = { robots: { index: false, follow: false } };
import { redirect } from 'next/navigation';

export default function MicroclassesPage() {
  redirect('/programs');
}
