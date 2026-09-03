import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false } };

export default function LegacyCatchAllPage() {
  redirect('https://admin.elevateforhumanity.org/instructor');
}
