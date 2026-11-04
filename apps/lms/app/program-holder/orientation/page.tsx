import Link from 'next/link';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { PartnerOrientationPlayer } from '@/components/program-holder/PartnerOrientationPlayer';
import { PartnerFormsLibrary } from '@/components/program-holder/PartnerFormsLibrary';
import { PartnerStandards } from '@/components/program-holder/PartnerStandards';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Partner onboarding | Elevate',
  robots: { index: false, follow: false },
};
export default async function OrientationPage() {
  const ctx = await requireProgramHolder({ allowPendingApproval: true });
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-7">
      <Link href="/program-holder/dashboard" className="text-blue-800 underline">
        Dashboard
      </Link>
      <h1 className="text-3xl font-black">Your program. Our shared commitment to excellence.</h1>
      <p className="text-sm">
        Watch the walkthrough, ask questions, then complete your own documents and signatures.
      </p>
      {ctx.mode === 'holder' ? (
        <PartnerOrientationPlayer />
      ) : (
        <p className="rounded-xl border p-5">
          Preview only. Partners must watch and sign from their own accounts.
        </p>
      )}
      <PartnerStandards />
      <PartnerFormsLibrary />
    </main>
  );
}
