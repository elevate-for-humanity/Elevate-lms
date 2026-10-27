import { redirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function PartnerProgramEditRedirect({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  await params;
  redirect('/host-shop/dashboard/programs');
}
