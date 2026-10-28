import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order Status | Elevate Store', robots: { index: false, follow: false } };
export default async function StoreSuccessPage({ searchParams }: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  redirect(`/store/orders${order_id ? `?order_id=${encodeURIComponent(order_id)}` : ''}`);
}
