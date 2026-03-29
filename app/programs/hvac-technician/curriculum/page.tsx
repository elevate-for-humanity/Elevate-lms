import { redirect } from 'next/navigation';

// Legacy HVAC curriculum page — consolidated into /programs/hvac-technician
export default function HvacCurriculumRedirect() {
  redirect('/programs/hvac-technician');
}
