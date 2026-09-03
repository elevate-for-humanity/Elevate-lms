export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/submissions');
}
