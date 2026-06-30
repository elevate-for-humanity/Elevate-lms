import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { Clock, Award, DollarSign, ChevronRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';
import { getProgramCardImage } from '@/lib/images/programImages';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

export const revalidate = 0; // always fresh - catalog should prefer DB state when available

export const metadata: Metadata = {
  title: `Programs | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Credential-bearing programs in healthcare, skilled trades, technology, beauty, and business. WIOA and Workforce Ready Grant funding available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs' },
};

const PROGRAM_IMAGES: Record<string, string> = {
  cna:'/images/pages/cna-nursing-real.webp',qma:'/images/pages/programs-cna-hero.webp',
  'medical-assistant':'/images/pages/medical-assistant-real.webp',
  'nha-phlebotomy':'/images/healthcare/hero-program-phlebotomy.jpg',
  phlebotomy:'/images/healthcare/hero-program-phlebotomy.jpg',
  'nha-patient-care-technician':'/images/healthcare/hero-program-patient-care.webp',
  'nha-billing-coding':'/images/pages/medical-assistant-desk.webp',
  'nha-pharmacy-technician':'/images/pages/pharmacy-technician.webp',
  'pharmacy-technician':'/images/pages/pharmacy-tech.webp',
  'nha-ekg-technician':'/images/healthcare/healthcare-professional-portrait-2.webp',
  'nha-ehr':'/images/pages/medical-assistant-lab.webp',
  'nha-medical-admin-assistant':'/images/pages/medical-assistant-desk.webp',
  'dental-assistant':'/images/healthcare/video-thumbnail-dental-assistant.webp',
  'cpr-first-aid':'/images/healthcare/cpr-certification-group.webp',
  'chw-cert':'/images/pages/peer-recovery.webp',
  'home-health-aide':'/images/healthcare/program-cna-training.webp',
  'direct-support-professional':'/images/pages/healthcare-classroom.webp',
  'dsp-training':'/images/pages/healthcare-classroom.webp',
  'peer-recovery-specialist':'/images/pages/peer-recovery.webp',
  'peer-support':'/images/pages/peer-recovery.webp',
  'drug-alcohol-specimen-collector':'/images/healthcare/healthcare-professional-portrait-1.jpg',
  'sanitation-infection-control':'/images/pages/healthcare-hero.webp',
  'hvac-technician':'/images/pages/hvac-technician.webp',
  electrical:'/images/pages/electrical.webp',
  plumbing:'/images/pages/plumbing-pipes.webp',
  'cdl-training':'/images/pages/cdl-hero.webp',
  welding:'/images/pages/welding-sparks.webp',
  'building-services-technician':'/images/programs/efh-building-tech-card.jpg',
  'building-maintenance-wrg':'/images/building-maintenance.webp',
  'construction-trades-certification':'/images/pages/construction-trades.webp',
  'automotive-technician':'/images/pages/skilled-trades-hero.webp',
  'diesel-mechanic':'/images/pages/trades-classroom.webp',
  'solar-panel-installation':'/images/pages/skilled-trades-sector.webp',
  'manufacturing-technician':'/images/pages/trades-classroom.webp',
  forklift:'/images/pages/trades-classroom.webp',
  'barber-apprenticeship':'/images/beauty/hero-program-barber.webp',
  'cosmetology-apprenticeship':'/images/pages/cosmetology-apprenticeship-hero.webp',
  'esthetician-apprenticeship':'/images/beauty/esthetician.webp',
  'nail-technician-apprenticeship':'/images/pages/nail-tech-hero.webp',
  'beauty-career-educator':'/images/beauty/program-beauty-training.webp',
  'culinary-apprenticeship':'/images/pages/healthcare-classroom.webp',
  'youth-culinary-apprenticeship':'/images/pages/healthcare-classroom.webp',
  'emt-apprenticeship':'/images/pages/healthcare-hero.webp',
  'it-help-desk':'/images/pages/tech-classroom.webp',
  'cybersecurity-analyst':'/images/pages/technology-sector.webp',
  'data-analytics':'/images/pages/tech-classroom.webp',
  'graphic-design':'/images/pages/tech-classroom.webp',
  'cad-drafting':'/images/pages/tech-classroom.webp',
  'web-development':'/images/pages/programs-tech-webdev-hero.webp',
  'tax-preparation':'/images/business/office-admin.webp',
  bookkeeping:'/images/business/office-admin.webp',
  'finance-bookkeeping-accounting':'/images/business/office-admin.webp',
  'business-startup':'/images/programs/efh-business-startup-marketing-hero.jpg',
  'business-administration':'/images/business/professional-2.jpg',
  'administrative-assistant':'/images/business/office-admin.webp',
  entrepreneurship:'/images/business/partnership-1.webp',
  'real-estate-agent':'/images/business/collaboration-1.webp',
  'insurance-agent':'/images/business/team-3.webp',
  'customer-service-representative':'/images/business/team-4.webp',
  'office-administration':'/images/business/office-admin.webp',
  'project-management':'/images/business/collaboration-1.webp',
  'servsafe-food-handler':'/images/pages/healthcare-classroom.webp',
  'servsafe-manager':'/images/pages/healthcare-classroom.webp',
  'guest-service-gold':'/images/pages/healthcare-classroom.webp',
  servsuccess:'/images/pages/healthcare-classroom.webp',
  'start-hospitality':'/images/pages/healthcare-classroom.webp',
};

const CATEGORY_META: Record<string,{label:string;color:string;order:number}> = {
  healthcare:       {label:'Healthcare',          color:'bg-blue-600',    order:1},
  trades:           {label:'Skilled Trades',       color:'bg-orange-600',  order:2},
  beauty:           {label:'Beauty & Cosmetology', color:'bg-pink-600',    order:3},
  technology:       {label:'Technology',           color:'bg-indigo-600',  order:4},
  business:         {label:'Business',             color:'bg-emerald-600', order:5},
  apprenticeship:   {label:'Apprenticeships',      color:'bg-purple-600',  order:6},
  hospitality:      {label:'Hospitality',          color:'bg-yellow-600',  order:7},
  'social services':{label:'Social Services',      color:'bg-teal-600',    order:8},
  special:          {label:'Workforce Readiness',  color:'bg-slate-600',   order:9},
};

const SUPPRESSED = new Set([
  'cna-training','hvac','hvac-technician-program','hvac-2024','medical-assistant-program',
  'phlebotomy-technician','phlebotomy-technician-program','barber','barber-program',
  'cosmetology','nail-technician','cpr-cert','health-safety','forklift-operator','tax-prep',
  'it-support','it-support-specialist','cybersecurity','bookkeeping-fundamentals',
  'entrepreneurship-small-business','peer-recovery-specialist-jri',
  'ai-advanced-project-management-1774494313718','ai-forklift-safety-certification-1774495387731',
  'jri-badge-1-mindsets','jri-badge-2-self-management','jri-badge-3-learning-strategies',
  'jri-badge-4-social-skills','jri-badge-5-workplace-skills','jri-badge-6-launch-a-career',
  'jri-introduction','jri','micro-programs','emergency-health-safety','nha-medical-assistant',
]);

type Prog = {slug:string;title:string;description:string|null;category:string;duration:string|null;credential:string|null;funding_eligible:boolean};

function normalizeCategory(category?: string | null, sector?: string | null, programType?: string | null): string {
  const raw = (category ?? '').trim().toLowerCase();
  const normalizedSector = (sector ?? '').trim().toLowerCase();

  if (raw.includes('health') || normalizedSector === 'healthcare') return 'healthcare';
  if (raw.includes('trade') || normalizedSector === 'skilled-trades') return 'trades';
  if (raw.includes('beauty') || raw.includes('cosmetology') || normalizedSector === 'personal-services') return 'beauty';
  if (raw.includes('tech') || normalizedSector === 'technology') return 'technology';
  if (raw.includes('business') || normalizedSector === 'business') return 'business';
  if (raw.includes('hospitality')) return 'hospitality';
  if (raw.includes('social')) return 'social services';
  if (programType === 'apprenticeship') return 'apprenticeship';
  return raw || 'other';
}

const staticProgramFallback: Prog[] = Array.from(STATIC_PROGRAM_MAP.values())
  .filter((program) => !SUPPRESSED.has(program.slug) && program.public_visible !== false && program.active !== false)
  .map((program) => {
    const hasFunding = Boolean(
      program.funding?.wioa_eligible ||
      program.funding?.wrg_eligible ||
      program.funding?.fssa_eligible ||
      program.fundingOptions?.some((option) => option === 'wioa' || option === 'wrg' || option === 'impact'),
    );
    return {
      slug: program.slug,
      title: program.title,
      description: program.subtitle || program.metaDescription || null,
      category: normalizeCategory(program.category, program.sector, program.programType),
      duration: program.durationWeeks ? `${program.durationWeeks} week${program.durationWeeks === 1 ? '' : 's'}` : null,
      credential: program.credentials?.[0]?.name ?? null,
      funding_eligible: hasFunding,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export default async function ProgramsPage() {
  let programs: Prog[] = staticProgramFallback;

  try {
    const db = createPublicClient();
    const {data} = await db.from('programs')
      .select('slug,title,short_description,description,category,duration,credential_type,wioa_eligible')
      .eq('is_active',true).eq('published',true).neq('status','archived').order('title');
    if (data?.length) {
      programs = data.filter(p=>!SUPPRESSED.has(p.slug)).map(p=>{
        let desc:string|null = p.short_description||p.description||null;
        if(desc&&!/[.!?]$/.test(desc.trim())){const l=Math.max(desc.lastIndexOf('.'),desc.lastIndexOf('!'),desc.lastIndexOf('?'));desc=l>20?desc.slice(0,l+1):null;}
        return {slug:p.slug,title:p.title,description:desc,category:normalizeCategory(p.category),duration:p.duration??null,credential:p.credential_type??null,funding_eligible:p.wioa_eligible??false};
      });
    }
  } catch {
    programs = staticProgramFallback;
  }

  const grouped:Record<string,Prog[]>={};
  programs.forEach(p=>{if(!grouped[p.category])grouped[p.category]=[];grouped[p.category].push(p);});
  const cats=Object.keys(grouped).sort((a,b)=>(CATEGORY_META[a]?.order??99)-(CATEGORY_META[b]?.order??99));

  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-64 sm:h-80 w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image sizes="(max-width: 768px) 100vw, 1200px" src="/images/programs-hero-vibrant.webp" alt={`${PLATFORM_DEFAULTS.orgName} programs`} fill className="object-cover object-center" priority placeholder="empty" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/85 to-brand-blue-900/30" />
        <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-12 max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">{PLATFORM_DEFAULTS.orgName}</p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">Career Training Programs</h1>
          <p className="mt-3 text-slate-200 text-sm sm:text-base max-w-xl">
            {programs.length} credential-bearing programs · 4-12 weeks · WIOA &amp; WRG funding available
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/orientation/schedule" className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-700 transition-colors">
              Schedule Free Orientation
            </Link>
            <Link href="/programs/catalog" className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
              Search Full Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Category nav */}
      <nav className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <ul className="flex gap-1 py-2 whitespace-nowrap">
            <li><a href="#top" className="inline-block px-4 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">All ({programs.length})</a></li>
            {cats.map(cat=>(
              <li key={cat}><a href={`#cat-${cat}`} className="inline-block px-4 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                {CATEGORY_META[cat]?.label??cat} ({grouped[cat].length})
              </a></li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Funding banner */}
      <div className="bg-brand-green-50 border-b border-brand-green-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-green-800">
          <span className="font-semibold">Funding available:</span>
          <span>WIOA Individual Training Account</span>
          <span className="hidden sm:inline text-brand-green-300">·</span>
          <span>Workforce Ready Grant</span>
          <span className="hidden sm:inline text-brand-green-300">·</span>
          <span>JRI / Reentry</span>
          <span className="hidden sm:inline text-brand-green-300">·</span>
          <span>Payment Plans</span>
          <Link href="/funding/how-it-works" className="ml-auto font-semibold underline hover:text-brand-green-900 whitespace-nowrap">Check eligibility →</Link>
        </div>
      </div>

      {/* Sections */}
      <div id="top" className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {cats.map(cat=>{
          const meta=CATEGORY_META[cat];
          const list=[...grouped[cat]].sort((a,b)=>a.title.localeCompare(b.title));
          return (
            <section key={cat} id={`cat-${cat}`} className="scroll-mt-16">
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
                <div className={`w-1 h-8 rounded-full ${meta?.color??'bg-slate-400'}`} />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{meta?.label??cat}</h2>
                <span className="text-sm text-slate-400">{list.length} program{list.length!==1?'s':''}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(p=>(
                  <Link key={p.slug} href={`/programs/${p.slug}`}
                    className="group flex flex-col rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 bg-white">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 flex-shrink-0">
                      <Image src={resolveSiteImagePath(PROGRAM_IMAGES[p.slug] ?? getProgramCardImage(p.slug))} alt={p.title} fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" placeholder="empty" />
                      {p.funding_eligible&&(
                        <span className="absolute top-2 left-2 bg-brand-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">WIOA Eligible</span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-brand-red-600 transition-colors">{p.title}</h3>
                      {p.description&&<p className="mt-1.5 text-xs text-slate-500 line-clamp-2 flex-1">{p.description}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {p.duration&&<span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{p.duration}</span>}
                        {p.credential&&<span className="flex items-center gap-1"><Award className="w-3 h-3" aria-label="award"/>{p.credential}</span>}
                        {p.funding_eligible&&!p.duration&&!p.credential&&<span className="flex items-center gap-1 text-brand-green-600"><DollarSign className="w-3 h-3"/>Funding available</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-red-600 group-hover:gap-2 transition-all">
                        View program <ChevronRight className="w-3.5 h-3.5"/>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* External Pathways - Google & Microsoft */}
      <section className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-extrabold text-slate-900 mb-1">External Certification Pathways</h2>
          <p className="text-slate-500 text-sm mb-6">Google and Microsoft certificates available through Coursera and LinkedIn Learning. Elevate advisors can help you access funding and enroll.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { slug: 'google-it-support', title: 'Google IT Support Certificate', issuer: 'Google / Coursera', weeks: '3-6 months' },
              { slug: 'google-cybersecurity', title: 'Google Cybersecurity Certificate', issuer: 'Google / Coursera', weeks: '6 months' },
              { slug: 'google-data-analytics', title: 'Google Data Analytics Certificate', issuer: 'Google / Coursera', weeks: '6 months' },
              { slug: 'google-project-management', title: 'Google Project Management Certificate', issuer: 'Google / Coursera', weeks: '6 months' },
              { slug: 'microsoft-azure-fundamentals', title: 'Microsoft Azure Fundamentals (AZ-900)', issuer: 'Microsoft', weeks: '4-6 weeks' },
              { slug: 'microsoft-365-fundamentals', title: 'Microsoft 365 Fundamentals (MS-900)', issuer: 'Microsoft', weeks: '4-6 weeks' },
            ].map((p) => (
              <Link key={p.slug} href={`/apply?program=${p.slug}`} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-green-400 hover:shadow-sm transition-all group">
                <p className="font-bold text-slate-900 text-sm group-hover:text-brand-green-700 leading-snug">{p.title}</p>
                <p className="text-slate-500 text-xs mt-1">{p.issuer} · {p.weeks}</p>
                <p className="text-brand-red-600 text-xs font-semibold mt-3">Apply for funding →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Not sure where to start?</h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Schedule a free orientation. We&apos;ll match you to the right program, check your funding eligibility, and get you enrolled.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/orientation/schedule" className="rounded-lg bg-brand-red-600 px-8 py-3 font-semibold text-white hover:bg-brand-red-700 transition-colors">
              Schedule Free Orientation
            </Link>
            <Link href="/contact" className="rounded-lg border border-white/30 px-8 py-3 font-semibold text-white hover:bg-white/10 transition-colors">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
