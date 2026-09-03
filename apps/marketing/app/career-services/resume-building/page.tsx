import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle, Download, Clock } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Resume Building | Career Services',
  keywords: ['resume', 'career', 'job search', 'interview prep', 'career services'],
  description: 'Build a professional resume that stands out. Get templates, tips, and personalized guidance from our career services team.',
};

export default function ResumeBuildingPage() {
  const features = [
    { icon: FileText, title: 'Professional Templates', desc: 'Industry-aware resume structures that keep your experience clear and readable.' },
    { icon: CheckCircle, title: 'Keyword Optimization', desc: 'ATS-conscious formatting and language aligned to the jobs you are targeting.' },
    { icon: Download, title: 'Export-Ready Documents', desc: 'Prepare a polished resume that can be saved and shared with employers.' },
    { icon: Clock, title: 'Career Coach Review', desc: 'Get feedback from career services based on your goals and work history.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/pathways-page-6.webp"
        alt="Resume and career planning support"
        eyebrow="Career Services"
        title="Build a Resume That Gets Interviews"
        description="Your resume is often your first employer impression. Career services helps you present your training, skills, and experience clearly and professionally."
        actions={(
          <>
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Get Resume Help</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Browse Programs</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">What We Offer</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-700">Practical support to help you create a resume that is clear, relevant, and employer-ready.</p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <f.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-2 font-bold text-slate-950">{f.title}</h3>
                <p className="text-sm text-slate-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-950 md:text-3xl">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Share Your Background', desc: 'Bring your current resume or provide your work history, training, credentials, and target roles.' },
              { step: '2', title: 'Get Career Feedback', desc: 'Career services reviews structure, wording, relevance, and employer-readiness.' },
              { step: '3', title: 'Finalize Your Resume', desc: 'Make the recommended updates and prepare the version you will use for applications and interviews.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-700 text-xl font-bold text-white">{s.step}</div>
                <h3 className="mb-2 font-bold text-slate-950">{s.title}</h3>
                <p className="text-sm text-slate-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-blue-100 bg-brand-blue-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {['ATS-conscious formatting', 'Skills and credential emphasis', 'Employment-history presentation', 'Job-specific keyword review', 'Contact and profile cleanup', 'Interview-ready application materials'].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-brand-blue-100 bg-white p-5 text-slate-800">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-700" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold text-slate-950 md:text-3xl">Ready to Stand Out?</h2>
          <p className="mb-8 text-slate-700">Connect with career services to review your resume and job-search materials.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/career-services/contact" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white transition-colors hover:bg-brand-blue-800">Contact Career Services</Link>
            <Link href="/programs" className="inline-flex items-center rounded-lg border-2 border-slate-300 px-8 py-4 font-bold text-slate-800 transition-colors hover:bg-slate-50">Explore Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
