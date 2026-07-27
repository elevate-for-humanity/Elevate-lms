import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle, Download, Clock, Users, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resume Building | Career Services',
  keywords: ["resume", "career", "job search", "interview prep", "career services"],
  description: 'Build a professional resume that stands out. Get templates, tips, and personalized guidance from our career services team.',
};

export default function ResumeBuildingPage() {
  const features = [
    { icon: FileText, title: 'Professional Templates', desc: 'Industry-specific resume templates designed by hiring experts.' },
    { icon: CheckCircle, title: 'Keyword Optimization', desc: 'ATS-friendly resumes that pass automated screening systems.' },
    { icon: Download, title: 'Instant Export', desc: 'Download your resume in multiple formats - PDF, Word, and more.' },
    { icon: Clock, title: 'Quick Turnaround', desc: 'Get resume feedback within 24-48 hours of submission.' },
  ];

  const testimonials = [
    { name: 'Marcus T.', role: 'Medical Assistant Graduate', quote: 'My resume went from generic to professional. I got 3 interviews in my first week.' },
    { name: 'Jennifer K.', role: 'HVAC Technician', quote: 'The career team helped me highlight my hands-on experience. Best investment I made.' },
    { name: 'David R.', role: 'Barber Apprentice', quote: 'They turned my limited work history into something employers noticed.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-red-500 to-brand-orange-500" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-red-500/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              Career Services
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Build a Resume That Gets Interviews
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Your resume is your first impression. We help you craft a professional resume that showcases your skills, training, and potential to employers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/career-services/contact" className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Get Resume Help
              </Link>
              <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-4">What We Offer</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">Everything you need to create a resume that stands out to employers.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200">
                <f.icon className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Submit Your Current Resume', desc: 'Share your existing resume or fill out our career questionnaire.' },
              { step: '2', title: 'Get Expert Feedback', desc: 'Our career coaches review and provide personalized suggestions.' },
              { step: '3', title: 'Receive Your Final Resume', desc: 'Get an ATS-optimized, professional resume ready to impress.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-brand-blue-100">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-700 mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Ready to Stand Out?</h2>
          <p className="text-slate-600 mb-8">Get started on your professional resume today.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/career-services/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Contact Career Services
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
