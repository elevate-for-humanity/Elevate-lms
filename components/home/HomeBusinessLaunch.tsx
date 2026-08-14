import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Globe2, Sparkles } from 'lucide-react';

export function HomeBusinessLaunch() {
  return (
    <section className="bg-slate-950 py-16 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-black text-slate-200">
              <BriefcaseBusiness className="h-4 w-4" /> Career skills + business launch tools
            </span>
            <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Get certified. Then build the business around your skills.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Elevate does more than career training. Business and entrepreneurship learners can use AI-powered tools to build a website, organize customer follow-up, create training, launch a community and grow their operation without needing to code.
            </p>
            <div className="mt-7 space-y-3 text-sm text-slate-200">
              {[
                'Describe your business in plain English',
                'Let AI create the website starting point',
                'Edit, preview and publish without code',
                'Add CRM, AI assistants, courses, community and business tools as you grow',
              ].map((item) => <div key={item} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"/><span>{item}</span></div>)}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/store/apps/website-builder" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 font-black hover:bg-brand-red-500">Build a Website <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/store#guided-setup" className="rounded-xl border border-white/25 px-6 py-3.5 font-black hover:bg-white/10">Tell AI What I Need</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl sm:p-7">
            <div className="rounded-2xl bg-white p-5 text-slate-950 sm:p-7">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div><p className="text-xs font-black uppercase tracking-wider text-brand-red-700">Elevate AI Website Builder</p><h3 className="mt-1 text-xl font-black">What business are you building?</h3></div>
                <Globe2 className="h-8 w-8 text-slate-400" />
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">“Build a professional website for my home-care business with services, about us, contact form and a strong call to action.”</div>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-950 p-4 text-white"><Sparkles className="h-5 w-5 text-brand-red-300"/><div><p className="font-black">Creating your first draft…</p><p className="mt-1 text-sm text-slate-300">Structure • content • branding starting point • SEO fields</p></div></div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs font-bold text-slate-600"><div className="rounded-lg border border-slate-200 p-3">Edit</div><div className="rounded-lg border border-slate-200 p-3">Preview</div><div className="rounded-lg border border-slate-200 p-3">Publish</div></div>
              <p className="mt-4 text-xs leading-5 text-slate-500">No code required to start. Advanced controls are available only when the customer needs them.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
