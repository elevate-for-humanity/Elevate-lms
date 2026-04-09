import { redirect } from 'next/navigation';

// WOTC management is handled in the admin portal
export default function Page() {
  redirect('/admin/wotc');
}
