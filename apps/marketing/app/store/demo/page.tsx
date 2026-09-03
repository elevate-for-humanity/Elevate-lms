export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// /store/demos is canonical. All inbound links updated — this redirect
// handles any external or cached links to the old URL.
export default function StoreDemoRedirect() {
  redirect('/store/demos');
}
