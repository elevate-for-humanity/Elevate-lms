import { redirect } from 'next/navigation';

// Consolidated into the unified barber application page
export default function BarbershopApplyRedirect() {
  redirect('/programs/barber-apprenticeship/apply?type=partner_shop');
}
