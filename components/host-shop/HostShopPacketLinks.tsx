import { normalizeHostShopProgram, type HostShopProgramType } from '@/lib/partners/host-shop-onboarding';

const syllabi: Record<HostShopProgramType, [string, string]> = {
  barber: ['Barber', 'Barber'],
  cosmetology: ['Cosmetology', 'Cosmetology'],
  esthetician: ['Esthetics', 'Esthetician'],
  nail_technician: ['Nail technology', 'Nail-Technician'],
};

export default function HostShopPacketLinks({ primary, programs }: {
  primary: HostShopProgramType;
  programs?: string[] | null;
}) {
  const assigned = new Set<HostShopProgramType>([primary]);
  for (const value of programs || []) {
    const program = normalizeHostShopProgram(value);
    if (program) assigned.add(program);
  }
  return <>
    <a href="/docs/host-shop-packets/Host-Shop-Operating-Guide.pdf" download className="inline-flex min-h-11 items-center rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">Download operating guide</a>
    {[...assigned].map((program) => {
      const [label, file] = syllabi[program];
      return <a key={program} href={`/docs/host-shop-packets/${file}-Apprenticeship-Syllabus.pdf`} download className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 font-bold">
        {label} syllabus (PDF)
      </a>;
    })}
  </>;
}
