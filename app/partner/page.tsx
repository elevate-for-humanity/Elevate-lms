/**
 * Partner = Program Holder
 * 
 * DEPRECATED: This route has been moved to /host-shop/
 * 
 * All partner functionality is now at /host-shop/
 */
import { redirect } from 'next/navigation';

export default function PartnerPage() {
  redirect('/host-shop');
}
