import { redirect } from 'next/navigation';

export default function StoreCheckoutRedirect() {
  redirect('/store/licenses');
}
