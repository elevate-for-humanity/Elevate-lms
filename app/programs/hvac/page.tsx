import { redirect } from 'next/navigation';

// Consolidate duplicate HVAC pages — canonical page is /programs/hvac-technician
export default function HVACRedirect() {
  redirect('/programs/hvac-technician');
}
