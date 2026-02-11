import { redirect } from 'next/navigation';

export default function AIStudioCheckoutRedirect() {
  redirect('/store/licenses');
}
