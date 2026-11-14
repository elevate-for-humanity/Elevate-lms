import { getVoucherRoster } from '@/lib/admin/voucher-roster';
import { VoucherRoster } from './VoucherRoster';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Funding Reconciliation', robots: { index: false, follow: false } };
export default async function Page() { return <VoucherRoster rows={await getVoucherRoster()} />; }
