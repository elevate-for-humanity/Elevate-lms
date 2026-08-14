import Link from 'next/link';
import { ArrowLeft, Calendar, User, FileText } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface FAQ {
  question: string;
  answer: string;
}

interface ResourcePageProps {
  title: string;
  description: string;
  lastReviewed: string;
  reviewedBy: string;
  version?: string;
  intro: string;
  overview: string | React.ReactNode;
  howItWorks: { title?: string; steps: string[] };
  timingAndVariability?: { title?: string; content: string | React.ReactNode };
  faqs: FAQ[];
  platformRelation: string | React.ReactNode;
  parentPage: { href: string; label: string };
  relatedResources: Array<{ href: string; label: string }>;
  governanceLinks?: Array<{ href: string; label: string }>;
}

export function ResourcePageTemplate({ title, description, lastReviewed, reviewedBy, version, intro, overview, howItWorks, timingAndVariability, faqs, platformRelation, parentPage, relatedResources, governanceLinks = [] }: ResourcePageProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: parentPage.label, href: parentPage.href }, { label: title }]} /></div></div>
      <div className="bg-white py-12 border-t"><div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-slate-300 text-lg max-w-3xl">{description}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Last reviewed: {lastReviewed}</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" />Reviewed by: {reviewedBy}</span>
          {version && <span className="flex items-center gap-1"><FileText className="w-4 h-4" />Version: {version}</span>}
        </div>
      </div></div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-slate max-w-none">
          <section className="mb-10"><p className="text-lg text-slate-700 leading-relaxed">{intro}</p></section>
          <section className="mb-10"><h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Overview</h2>{typeof overview === 'string' ? <p className="text-slate-700 leading-relaxed">{overview}</p> : overview}</section>
          <section className="mb-10"><h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">{howItWorks.title || 'How the Process Works'}</h2><ol className="list-decimal list-inside space-y-3 text-slate-700">{howItWorks.steps.map((step, index) => <li key={index} className="leading-relaxed">{step}</li>)}</ol></section>
          {timingAndVariability && <section className="mb-10"><h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">{timingAndVariability.title || 'Timing & Variability'}</h2>{typeof timingAndVariability.content === 'string' ? <p className="text-slate-700 leading-relaxed">{timingAndVariability.content}</p> : timingAndVariability.content}</section>}
          <section className="mb-10"><h2 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Common Questions</h2><div className="space-y-6">{faqs.map((faq, index) => <div key={index} className="border-l-4 border-brand-blue-500 pl-4"><h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3><p className="text-slate-700">{faq.answer}</p></div>)}</div></section>
          <section className="mb-10 bg-slate-50 rounded-xl p-6 border border-slate-200"><h2 className="text-xl font-bold text-slate-900 mb-4">How This Relates to Our Platform</h2>{typeof platformRelation === 'string' ? <p className="text-slate-700 leading-relaxed">{platformRelation}</p> : platformRelation}</section>
          <section className="mb-10 bg-amber-50 rounded-xl p-6 border border-amber-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">References & Disclosures</h2>
            <p className="text-slate-700 mb-4 italic">This content is informational only and does not constitute professional advice.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/governance" className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">Governance Documents →</Link>
              <Link href="/governance/security" className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">Security & Data Protection →</Link>
              {governanceLinks.map((link, index) => <Link key={index} href={link.href} className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">{link.label} →</Link>)}
            </div>
          </section>
          {relatedResources.length > 0 && <section className="mb-10"><h2 className="text-xl font-bold text-slate-900 mb-4">Related Resources</h2><div className="grid md:grid-cols-2 gap-4">{relatedResources.map((resource, index) => <Link key={index} href={resource.href} className="block p-4 border border-slate-200 rounded-lg hover:border-brand-blue-500 hover:bg-brand-blue-50 transition-colors"><span className="font-medium text-slate-900">{resource.label}</span><span className="text-brand-blue-600 ml-2">→</span></Link>)}</div></section>}
        </article>
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500 mb-4">Last reviewed: {lastReviewed} • Reviewed by: {reviewedBy}{version && ` • Version: ${version}`}</p>
          <Link href={parentPage.href} className="inline-flex items-center px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"><ArrowLeft className="w-4 h-4 mr-2" />Back to {parentPage.label}</Link>
        </div>
      </div>
    </div>
  );
}

export function generateResourceMetadata(props: { title: string; description: string; path: string }) {
  return {
    title: props.title,
    description: props.description,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${props.path}` },
    openGraph: { title: props.title, description: props.description, url: `${PLATFORM_DEFAULTS.siteUrl}${props.path}`, siteName: PLATFORM_DEFAULTS.orgName, type: 'article' },
    robots: { index: true, follow: true },
  };
}
