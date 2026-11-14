import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PublicEditorialHero } from '@/components/marketing/PublicEditorialHero';

export const metadata: Metadata = {
  title: 'Student Support Services',
  description: 'Find academic help, funding guidance, career services, accessibility support and advising in one place.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/student-support' },
};
const services = [
  { id: 'academic', title: 'Academic support', description: 'Ask about coursework, exam preparation, study resources, and help staying on track in your program.', href: '/contact?topic=academic-support', action: 'Ask for academic help', image: '/images/licensed-envato/resources-study-378c48c4.webp', alt: 'Learner reviewing study materials beside a laptop' },
  { id: 'financial-aid', title: 'Funding & payment guidance', description: 'Review program-specific funding pathways, scholarships when available, and payment options. Eligibility and authorization come from the responsible funding source.', href: '/funding', action: 'Review funding options', image: '/images/pages/about-funding-nav.webp', alt: 'Funding guidance resources' },
  { id: 'career', title: 'Career services', description: 'Get connected with resume support, interview preparation, job-search resources, and employer opportunities.', href: '/career-services', action: 'Explore career services', image: '/images/programs/refresh-20261101/employers.webp', alt: 'Illustrative employer and workforce collaboration scene' },
  { id: 'counseling', title: 'Wellness & referrals', description: 'Ask for help finding counseling, wellness, and community resources. Availability, cost, and confidentiality terms depend on the service provider.', href: '/contact?topic=wellness-referrals', action: 'Request resource guidance', image: '/images/pages/career-counseling.webp', alt: 'Career counseling and guidance' },
  { id: 'accessibility', title: 'Accessibility & accommodations', description: 'Contact our team to discuss a reasonable accommodation, accessible learning resources, or an individualized support plan.', href: '/accessibility', action: 'Review accessibility support', image: '/images/about-training-20261102.webp', alt: 'Illustrative instructor supporting adult learners in career training' },
  { id: 'scheduling', title: 'Scheduling & advising', description: 'Discuss your program, class schedule, and next steps with the team. Available appointment formats are shown during scheduling.', href: '/student-support/schedule', action: 'Schedule an appointment', image: '/images/pages/office-admin-desk.jpg', alt: 'Office workspace for organizing appointments and schedules' },
];
export default function StudentSupportPage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'Student Support' }]} /></div>
    <PublicEditorialHero eyebrow="Student support" title="Support for your next step." description="Find the right help without searching through separate pages. Choose a topic below or speak with our team about what you need." image="/images/career-advising-20261102.webp" imageAlt="Illustrative advisor and adult learner planning a training pathway">
      <Link href="/contact?topic=student-support" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Contact student support</Link>
      <Link href="/student-support/schedule" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">Schedule an appointment</Link>
    </PublicEditorialHero>
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-7 text-3xl font-bold">How can we help?</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{services.map(service => <article id={service.id} key={service.id} className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[3/2]"><Image src={service.image} alt={service.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /></div>
        <div className="p-6"><h3 className="text-xl font-bold">{service.title}</h3><p className="mt-3 leading-7 text-slate-700">{service.description}</p><Link href={service.href} className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">{service.action}<ArrowRight className="h-4 w-4 shrink-0" /></Link></div>
      </article>)}</div>
    </section>
    <section className="bg-slate-50 px-4 py-12"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6"><div><h2 className="text-2xl font-bold">Ready to explore a program?</h2><p className="mt-3 leading-7 text-slate-700">Compare training options and review your next enrollment step.</p></div><Link href="/programs" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Browse programs</Link></div></section>
  </main>;
}
