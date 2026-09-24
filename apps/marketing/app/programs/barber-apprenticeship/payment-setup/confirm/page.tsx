import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default function PaymentSetupConfirmPage(){
  redirect('/programs/barber-apprenticeship/payment-setup');
}
