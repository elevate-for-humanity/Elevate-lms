import { redirect } from 'next/navigation';

export default function ProgramCheckoutRedirect() {
  redirect('/store/licenses');
}
