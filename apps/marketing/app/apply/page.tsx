import Image from 'next/image';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Choose Your Application | Elevate for Humanity',
  description:
    'Apply as a student, apprentice, Host Shop, employer, or training partner with Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply',
  },
};

export default async function ApplyPage({ searchParams }: {
  searchParams?: Promise<{ program?: string; payment?: string; funding?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params?.program) query.set('program', params.program);
  if (params?.payment) query.set('payment', params.payment);
  if (params?.funding) query.set('funding', params.funding);
  if (query.size) redirect(`/apply/student?${query.toString()}`);
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="relative mb-8 h-64 overflow-hidden rounded-3xl bg-slate-100 sm:h-80">
        <Image src="/images/pages/partner-page-9.webp" alt="Professional training and Host Shop partnership" fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
      </div>
      <h1 className="text-4xl font-black text-slate-950">Choose your application</h1>
      <p className="mt-3 text-lg text-slate-700">Select the service you want to join.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          ['/apply/student', 'Student or apprentice', 'Apply for career training or an apprenticeship.'],
          ['/partners/host-shop/apply', 'Host Shop', 'Apply to host barber, cosmetology, esthetics, or nail apprentices.'],
          ['/apply/employer', 'Employer', 'Connect your business with training and hiring services.'],
          ['/apply/program-holder', 'Program Holder', 'Apply to provide training with Elevate.'],
        ].map(([href, title, detail]) => (
          <a key={href} href={href} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm hover:border-slate-950">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-slate-700">{detail}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
