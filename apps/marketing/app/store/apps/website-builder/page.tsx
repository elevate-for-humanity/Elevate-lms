import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Globe2, Layout, Search, Palette, Upload, Pencil, Sparkles, Rocket, WandSparkles } from 'lucide-react';
import { IndividualAppPlansSection } from '@/components/store/IndividualAppPlansSection';
import ProductWalkthrough from '@/components/store/ProductWalkthrough';
import ZeroCodeSetup from '@/components/store/ZeroCodeSetup';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export const dynamic = 'force-static';
export const metadata: Metadata = { title: 'AI Website Builder — Build Without Code | Elevate Store', description: 'Describe your business and use Elevate AI to create, customize, preview and publish your website without coding.', alternates: { canonical: 'https://www.elevateforhumanity.org/store/apps/website-builder' } };
const catalog = INDIVIDUAL_APP_CATALOG['website-builder'];
const features = [
  { icon: Sparkles, title: 'AI first draft', desc: 'Tell Elevate what you do and generate the starting structure and copy instead of beginning with a blank screen.' },
  { icon: Layout, title: 'Zero-code editing', desc: 'Change the homepage, identity and content without writing HTML, CSS or JavaScript.' },
  { icon: Palette, title: 'Your brand', desc: 'Set logo text, tagline and brand colors from the editor.' },
  { icon: Search, title: 'Search-ready fields', desc: 'Manage site title and description so your business has an SEO foundation.' },
  { icon: Globe2, title: 'Preview and publish', desc: 'Preview your work, choose an available Elevate subdomain and publish.' },
  { icon: Upload, title: 'Bring an existing site', desc: 'Use the import workflow when you already have a website and want to move into Elevate.' },
];
const walkthrough = [
  { label: '1. Describe it', title: 'Tell AI what business you are building', description: 'Example: “Build a professional home-healthcare agency website in Indianapolis with services, an about section and a contact call to action.”' },
  { label: '2. Generate', title: 'Elevate creates your first draft', description: 'AI turns your business description into a starting website structure and content so you are not staring at a blank canvas.' },
  { label: '3. Make it yours', title: 'Edit the words, brand and look', description: 'Update your business name, hero message, colors, tagline and search metadata from the visual workspace—no code required.' },
  { label: '4. Preview', title: 'Review before anybody sees it', description: 'Preview the site, refine the message and make sure the business is represented correctly before publishing.' },
  { label: '5. Publish', title: 'Choose your web address and go live', description: 'Select an available Elevate subdomain and publish the saved website configuration when you are ready.' },
];
const setupQuestions = [
  { id: 'business', prompt: 'What business or organization are you building this website for?', placeholder: 'Example: A home healthcare agency serving Indianapolis...' },
  { id: 'goal', prompt: 'What should the website help you accomplish?', choices: [
    { label: 'Get leads', value: 'lead-generation', description: 'Calls, forms and consultations.' },
    { label: 'Sell services', value: 'sell-services', description: 'Explain offers and drive purchases.' },
    { label: 'Enroll students', value: 'student-enrollment', description: 'Programs, applications and enrollment.' },
    { label: 'Build credibility', value: 'credibility', description: 'Professional presence and trust.' },
  ]},
  { id: 'style', prompt: 'How should the site feel?', choices: [
    { label: 'Professional', value: 'professional' },
    { label: 'Modern', value: 'modern' },
    { label: 'Warm', value: 'warm' },
    { label: 'Bold', value: 'bold' },
  ]},
  { id: 'pages', prompt: 'What should the first version include?', placeholder: 'Example: Home, About, Services, Contact, booking form and testimonials.' },
];

export default function WebsiteBuilderStorePage() {
  return <main className="min-h-screen bg-white">
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(220,38,38,.2),transparent_35%)]"/><div className="relative mx-auto max-w-6xl"><div className="max-w-4xl"><p className="text-sm font-black uppercase tracking-[.22em] text-brand-red-400">Elevate AI Website Builder</p><h1 className="mt-4 text-5xl font-black leading-[1.02] md:text-7xl">Build your business website at the snap of a finger.</h1><p className="mt-6 max-w-3xl text-xl leading-9 text-slate-300">Describe your business. Let AI create the starting point. Customize it without code, preview it, and publish from one workspace. You do not need to be a web developer to get started.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#guided-setup" className="rounded-xl bg-brand-red-600 px-7 py-4 font-black hover:bg-brand-red-700">Build my website</a><a href="#demo" className="rounded-xl border border-white/30 px-7 py-4 font-black hover:bg-white/10">Watch the walkthrough</a></div><p className="mt-4 text-sm text-slate-400">Generation speed varies with the request and service load. Preview and approve your content before publishing.</p></div></div></section>
    <section id="demo"><ProductWalkthrough title="From business idea to a publishable website" subtitle="This walkthrough shows the actual customer journey the Website Builder is designed around. Watch it automatically or choose a step." steps={walkthrough} tryHref={catalog.appHref}/></section>
    <div id="guided-setup"><ZeroCodeSetup productName="AI Website Builder" intro="Answer four simple questions and Elevate carries that context into the Website Builder so you can start with a configured direction instead of an empty canvas." questions={setupQuestions} startHref={catalog.appHref} trialHref={catalog.trialHref} advancedNote="Professional and Enterprise can expose custom domains, imports, white-label, API and multi-user controls after the basic zero-code workflow is working." /></div>
    <section className="bg-slate-50 px-4 py-16"><div className="mx-auto max-w-6xl"><div className="max-w-3xl"><p className="font-black uppercase tracking-wider text-brand-red-700">Why it is easier</p><h2 className="mt-2 text-4xl font-black text-slate-950">No code. No blank canvas. No web-development vocabulary required.</h2><p className="mt-4 text-lg leading-8 text-slate-600">The goal is to let a business owner work in plain English while Elevate handles the website workflow underneath.</p></div><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{features.map(({icon:Icon,title,desc}) => <article key={title} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200"><Icon className="h-7 w-7 text-brand-red-700"/><h3 className="mt-5 text-xl font-black text-slate-900">{title}</h3><p className="mt-2 leading-7 text-slate-600">{desc}</p></article>)}</div></div></section>
    <section className="px-4 py-16"><div className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-slate-950 p-8 text-white md:grid-cols-3 md:p-12"><div><WandSparkles className="h-8 w-8 text-brand-red-400"/><h3 className="mt-4 text-2xl font-black">Faster starting point</h3><p className="mt-3 text-slate-300">Use AI to move from an idea to an editable first draft instead of building every section manually.</p></div><div><Pencil className="h-8 w-8 text-brand-red-400"/><h3 className="mt-4 text-2xl font-black">You stay in control</h3><p className="mt-3 text-slate-300">Review and edit the generated content. AI accelerates the work; it does not remove your approval step.</p></div><div><Rocket className="h-8 w-8 text-brand-red-400"/><h3 className="mt-4 text-2xl font-black">One path to publish</h3><p className="mt-3 text-slate-300">Create, edit, preview, save and publish without stitching together separate website tools.</p></div></div></section>
    <IndividualAppPlansSection catalog={catalog}/>
    <section className="px-4 py-16 text-center"><h2 className="text-3xl font-black text-slate-950">You already learned the skill. Now build the business around it.</h2><p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">Start with the Website Builder and add the Elevate tools your organization needs as it grows.</p><Link href={catalog.trialHref} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 font-black text-white">Start the {catalog.trialDays}-day trial <ArrowRight className="h-4 w-4"/></Link></section>
  </main>;
}
