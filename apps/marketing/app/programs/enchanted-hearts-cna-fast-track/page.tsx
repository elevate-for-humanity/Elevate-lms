import { redirect } from 'next/navigation';
export const metadata = { robots: { index: false, follow: true } };
export default function LegacyProgramPage() {
  redirect('/programs/healthcare-training/cna-fast-track');
}
