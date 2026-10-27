import { redirect, notFound } from 'next/navigation';
import { getEnchantedHeartsProgram } from '@/lib/partners/enchanted-hearts';
export const metadata = { robots: { index: false, follow: true } };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const program = getEnchantedHeartsProgram((await params).slug);
  if (!program) notFound();
  redirect(`/programs/healthcare-training/${program.publicSlug}`);
}
