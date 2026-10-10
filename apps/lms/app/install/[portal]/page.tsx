import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PROGRAM_IMAGES, getProgramHeroImage, getProgramImageAlt } from '@/lib/images/programImages';
import { Download, MonitorSmartphone } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

const PORTALS = {
  learner: { name: 'Student / Learner', manifest: '/manifest-lms.json', href: '/lms/dashboard' },
  apprentice: { name: 'Apprentice', manifest: '/manifest-apprentice.json', href: '/apprentice' },
  employer: { name: 'Employer', manifest: '/manifest-employer.json', href: '/employer/dashboard' },
  'program-holder': { name: 'Program Holder', manifest: '/manifest-program-holder.json', href: '/program-holder/dashboard' },
  'host-shop': { name: 'Host Shop', manifest: '/manifest-shop-owner.json', href: '/host-shop/dashboard' },
} as const;

type PortalKey = keyof typeof PORTALS;
type InstallProps = { params: Promise<{ portal: string }>; searchParams: Promise<{ program?: string }> };
async function selectedProgram(searchParams: InstallProps['searchParams']) {
  const { program } = await searchParams;
  return program && Object.hasOwn(PROGRAM_IMAGES, program) ? program : null;
}

export async function generateMetadata({ params, searchParams }: InstallProps): Promise<Metadata> {
  const key = (await params).portal as PortalKey;
  const portal = PORTALS[key] || PORTALS.learner;
  const program = await selectedProgram(searchParams);
  return { title: `Install Elevate ${portal.name}`, description: `Install the secure ${portal.name} portal.`, manifest: portal.manifest, openGraph: { images: [{ url: getProgramHeroImage(program || 'barber-apprenticeship'), alt: program ? getProgramImageAlt(program, 'Program training environment') : 'Elevate training portal' }] }, robots: { index: false, follow: false }, appleWebApp: { capable: true, title: `Elevate ${portal.name}`, statusBarStyle: 'black-translucent' } };
}

export default async function InstallPortalPage({ params, searchParams }: InstallProps) {
  const key = (await params).portal as PortalKey;
  const portal = PORTALS[key];
  const program = await selectedProgram(searchParams);
  const cover = getProgramHeroImage(program || 'barber-apprenticeship');
  if (!portal) return <main className="mx-auto max-w-xl p-8"><h1 className="text-3xl font-black">Portal not found</h1><Link href="/install" className="mt-5 inline-flex font-bold text-blue-700">View install options</Link></main>;
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950"><section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><div className="relative -mx-7 -mt-7 mb-7 aspect-[16/9] overflow-hidden rounded-t-3xl sm:-mx-10 sm:-mt-10"><Image src={cover} alt={program ? getProgramImageAlt(program, 'Program training environment') : "Hands-on apprenticeship training"} fill priority sizes="(min-width: 768px) 672px, 100vw" className="object-cover" /></div><MonitorSmartphone className="h-10 w-10 text-blue-700" /><h1 className="mt-5 text-3xl font-black">Install Elevate {portal.name}</h1><p className="mt-3 font-medium leading-7 text-slate-700">This installs the real {portal.name} PWA with its own identity, start page, scope, and secure sign-in. Dashboard records appear only after the authorized account signs in.</p><PwaInstallButton label={`Install ${portal.name} PWA`} installedLabel={`${portal.name} PWA Installed`} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-black text-white disabled:opacity-60" /><div className="mt-6 flex flex-wrap gap-3"><Link href={portal.href} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-2 font-bold">Open secure portal</Link><span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><Download className="h-4 w-4" />On iPhone, use Share → Add to Home Screen.</span></div></section></main>;
}
