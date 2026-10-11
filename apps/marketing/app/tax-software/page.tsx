import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, FileUp, FileCheck2, ShieldCheck, Sparkles, Landmark, Users, MonitorPlay } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash | AI-Assisted Tax Preparation Software',
  description: 'Explore guided self-filing, PARIS AI-assisted tax interviews, document review, and professional tax-office workflows.',
  alternates: { canonical: '/tax' },
};

const images = {
  hero: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=85',
  individual: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1100&q=80',
  business: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1100&q=80',
};
const features = [
  { icon: Bot, title: 'PARIS guided interview', detail: 'Plain-language questions for taxpayers and preparers.' },
  { icon: FileUp, title: 'Document import', detail: 'Import supported documents and confirm extracted fields.' },
  { icon: FileCheck2, title: 'Return review', detail: 'Organize information and inspect return details before filing.' },
  { icon: ShieldCheck, title: 'Secure workspaces', detail: 'Separate taxpayer and professional experiences.' },
];
const steps = [
  ['01','Start','Choose self-file or a professional workflow.'],
  ['02','Interview','Answer guided questions with PARIS.'],
  ['03','Import','Upload supported tax forms and verify values.'],
  ['04','Review','Inspect the return and resolve missing information.'],
];
const button = 'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition hover:opacity-90';

export default function TaxSoftwarePage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <div className="bg-slate-950 px-5 py-2.5 text-center text-xs font-semibold tracking-wide text-[#c8102e]">SUPERSONIC FAST CASH TAX SERVICE · AI-ASSISTED SOFTWARE</div>
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
        <Link href="/tax-software" className="flex items-center gap-3" aria-label="Supersonic Fast Cash home"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-2xl font-black italic text-[#e60023]">S</span><span className="text-lg font-black leading-tight">SUPERSONIC<span className="block text-xs tracking-[.16em] text-[#063d9b]">FAST CASH TAX SERVICE</span></span></Link>
        <nav aria-label="Tax software navigation" className="flex flex-wrap gap-5 text-sm font-semibold text-slate-700"><Link href="#solutions">Solutions</Link><Link href="/tax-software/features">Features</Link><Link href="/tax-software/bank-products">Bank Products</Link><Link href="/tax-software/pricing">Pricing</Link><Link href="/tax-software/about">About</Link><Link href="#process">How it works</Link><Link href="/tax-software/demo">Demo</Link></nav>
        <Link href="/tax-software/self-file" className={button+' bg-slate-950 text-white'}>Get started <ArrowRight className="h-4 w-4"/></Link>
      </div>
    </header>
    <section className="relative isolate overflow-hidden bg-[#f4f8ff] text-slate-950">
      
      
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-800"><Sparkles className="h-4 w-4"/> Tax preparation, reimagined</span>
          <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight sm:text-6xl">Power your taxes.<br/><span className="text-[#e60023]">Power your business.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">A modern tax preparation experience for individuals and tax professionals. Meet PARIS, our AI-assisted interview, and explore document intake, return review, and professional workflows.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/tax-software/demo" className={button+' bg-[#e60023] text-white'}>Explore software demo <ArrowRight className="h-4 w-4"/></Link><Link href="/tax-software/professional" className={button+' border border-[#063d9b] bg-white text-[#063d9b]'}>For tax professionals <ArrowRight className="h-4 w-4"/></Link></div>
          <p className="mt-5 max-w-xl text-xs leading-5 text-slate-600">IRS electronic filing and EPS bank-product processing require applicable approvals, credentials and certification. They are not represented as live production integrations.</p>
          <div className="mt-9 flex flex-wrap gap-5 border-t border-slate-200 pt-6 text-sm"><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#e60023]"/> Guided intake</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#e60023]"/> Document confirmation</span><span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#e60023]"/> Return review</span></div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="overflow-hidden rounded-2xl bg-white text-slate-950">
            <div className="flex items-center justify-between border-b px-6 py-5"><div><p className="text-xs font-black tracking-widest text-[#063d9b]">PARIS ASSISTANT</p><h2 className="mt-1 text-xl font-black">Guided tax interview</h2></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Preview</span></div>
            <div className="p-6"><div className="flex justify-between text-xs font-semibold text-slate-500"><span>Income & documents</span><span>Step 3 of 8</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full w-2/5 rounded-full bg-sky-600"/></div>
              <div className="mt-7 flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e9f1ff]"><Bot className="h-6 w-6 text-[#063d9b]"/></div><div className="rounded-2xl bg-slate-100 p-4"><p className="text-xs font-bold text-[#063d9b]">PARIS</p><p className="mt-2 text-sm leading-6">Let’s organize your income. Do you have a W-2 from an employer?</p></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm font-bold"><span className="rounded-xl border-2 border-sky-600 bg-[#edf4ff] p-3 text-[#063d9b]">Yes, I do</span><span className="rounded-xl border p-3">Not yet</span></div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed p-4"><FileUp className="h-6 w-6 text-[#063d9b]"/><div><p className="text-sm font-bold">Import your W-2</p><p className="text-xs text-slate-500">Confirm extracted values before use.</p></div></div>
              <Link href="/tax-software/self-file" className={button+' mt-5 w-full bg-[#063d9b] text-white'}>Open self-file workflow <ArrowRight className="h-4 w-4"/></Link>
            </div>
          </div><p className="mt-3 text-center text-xs text-slate-600">Illustrative preview · Use the linked workflow to interact</p>
        </div>
      </div>
    </section>
    <section id="solutions" className="scroll-mt-24 bg-slate-50 py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><p className="text-xs font-black uppercase tracking-widest text-[#063d9b]">Choose your path</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">Built for the way you file.</h2><p className="mt-4 max-w-2xl text-lg text-slate-600">Two dedicated experiences, one tax preparation platform.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="h-56 bg-cover bg-center" role="img" aria-label="Desk with paperwork and financial planning materials" style={{backgroundImage:'url('+images.individual+')'}}/><div className="p-8"><FileCheck2 className="h-8 w-8 text-[#063d9b]"/><h3 className="mt-4 text-3xl font-black">File your own taxes</h3><p className="mt-3 text-slate-600">Answer guided questions, upload a W-2, confirm values, and open your return workspace.</p><Link href="/tax-software/self-file" className="mt-6 inline-flex items-center gap-2 font-bold text-[#063d9b]">Explore self-file <ArrowRight className="h-4 w-4"/></Link></div></article>
        <article className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="h-56 bg-cover bg-center" role="img" aria-label="Business professionals working together" style={{backgroundImage:'url('+images.business+')'}}/><div className="p-8"><BriefcaseBusiness className="h-8 w-8 text-[#063d9b]"/><h3 className="mt-4 text-3xl font-black">Run your tax office</h3><p className="mt-3 text-slate-600">Explore professional preparation, client workflows, document handling, and review checkpoints.</p><Link href="/tax-software/professional" className="mt-6 inline-flex items-center gap-2 font-bold text-[#063d9b]">Explore professional software <ArrowRight className="h-4 w-4"/></Link></div></article>
      </div></div></section>
    <section id="features" className="scroll-mt-24 py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><p className="text-center text-xs font-black uppercase tracking-widest text-[#063d9b]">Inside the platform</p><h2 className="mt-3 text-center text-4xl font-black sm:text-5xl">More than a tax form.</h2><div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{features.map(({icon:Icon,title,detail})=><article key={title} className="rounded-2xl border p-6 shadow-sm"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e9f1ff]"><Icon className="h-6 w-6 text-[#063d9b]"/></div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p></article>)}</div></div></section>
    <section id="process" className="scroll-mt-24 bg-[#f4f8ff] py-20 text-slate-950"><div className="mx-auto max-w-7xl px-5 lg:px-8"><p className="text-xs font-black uppercase tracking-widest text-[#e60023]">How it works</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">From first question to final review.</h2><div className="mt-10 grid gap-5 md:grid-cols-4">{steps.map(([num,title,detail])=><article key={num} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-3xl font-black text-[#e60023]">{num}</p><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p></article>)}</div><Link href="/tax-software/demo" className={button+' mt-9 bg-[#e60023] text-white'}><MonitorPlay className="h-5 w-5"/> Walk through the demo <ArrowRight className="h-4 w-4"/></Link></div></section>
    <section className="py-20"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-2 lg:px-8"><div><p className="text-xs font-black uppercase tracking-widest text-[#063d9b]">For software-provider discussions</p><h2 className="mt-3 text-4xl font-black">Designed with professional workflows in mind.</h2><p className="mt-5 leading-8 text-slate-600">The software demonstration walks through intake, PARIS assistance, document confirmation, return review, and modeled bank-product application steps. IRS and EPS production connections remain subject to external requirements.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/tax-software/demo" className={button+' bg-slate-950 text-white'}>View provider demo <ArrowRight className="h-4 w-4"/></Link><Link href="/tax-software/professional" className={button+' border border-slate-300'}>Professional edition <ArrowRight className="h-4 w-4"/></Link></div></div><div className="grid gap-4 rounded-3xl bg-[#edf4ff] p-8"><div className="flex items-center gap-3"><Users className="h-7 w-7 text-[#063d9b]"/><span className="font-bold">Preparer and office workflows</span></div><div className="flex items-center gap-3"><Bot className="h-7 w-7 text-[#063d9b]"/><span className="font-bold">PARIS-assisted intake</span></div><div className="flex items-center gap-3"><Landmark className="h-7 w-7 text-[#063d9b]"/><span className="font-bold">Bank-product integration architecture</span></div><div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-[#063d9b]"/><span className="font-bold">Review and approval checkpoints</span></div></div></div></section>
    <section className="bg-[#063d9b] py-16 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-7 px-5 lg:px-8"><div><h2 className="text-3xl font-black sm:text-4xl">Ready to see Supersonic in action?</h2><p className="mt-3 text-sky-100">Choose a workflow or explore the software-provider demonstration.</p></div><div className="flex flex-wrap gap-3"><Link href="/tax-software/demo" className={button+' bg-white text-sky-900'}>View demo <ArrowRight className="h-4 w-4"/></Link><Link href="/tax-software/self-file" className={button+' border border-white/50 text-white'}>Start self-file <ArrowRight className="h-4 w-4"/></Link></div></div></section>
  </main>;
}
