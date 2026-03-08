import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employment Support | Career Services | Elevate for Humanity',
  description: 'Resume building, interview prep, job placement, and career coaching. Elevate connects graduates to employer partners in Indianapolis and across Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employment-support' },
};

const SERVICES = [
  { title: 'Resume Building', desc: 'Professional resume tailored to your target industry and credential. ATS-optimized formatting.', img: '/images/pages/resume-building-hero.jpg', alt: 'Resume building service' },
  { title: 'Interview Preparation', desc: 'Mock interviews, industry-specific question prep, and professional presence coaching.', img: '/images/pages/career-services-page-3.jpg', alt: 'Interview preparation coaching' },
  { title: 'Job Placement', desc: 'Direct connections to employer partners actively hiring credentialed graduates in your field.', img: '/images/pages/career-services-page-4.jpg', alt: 'Job placement services' },
  { title: 'Career Coaching', desc: 'One-on-one sessions to map your career path, set goals, and navigate the job market.', img: '/images/pages/career-services-page-5.jpg', alt: 'Career coaching session' },
  { title: 'Mentorship', desc: 'Paired with industry professionals who have walked the path you are on.', img: '/images/pages/mentorship-page-1.jpg', alt: 'Mentorship program' },
  { title: 'Supportive Services', desc: 'Transportation assistance, childcare referrals, and emergency support for eligible participants.', img: '/images/pages/about-supportive-services.jpg', alt: 'Supportive services for students' },
];

const OUTCOMES = [
  { stat: 'Day 1', label: 'Career services begin at enrollment — not after graduation' },
  { stat: 'WIOA', label: 'Funded support services for eligible Indiana residents' },
  { stat: 'Direct', label: 'Employer connections — no job board middleman' },
  { stat: 'Free', label: 'All career services included with enrollment' },
];

const STEPS = [
  { n: '1', title: 'Enroll in a Program', desc: 'Career services start on day one — not after you graduate.', img: '/images/pages/enrollment-page-1.jpg' },
  { n: '2', title: 'Build Your Profile', desc: 'Resume, LinkedIn, and professional portfolio developed during training.', img: '/images/pages/career-services-page-6.jpg' },
  { n: '3', title: 'Connect to Employers', desc: 'We introduce you to hiring partners before you finish your program.', img: '/images/pages/career-services-page-7.jpg' },
  { n: '4', title: 'Land the Job', desc: 'Ongoing support through your first 90 days on the job.', img: '/images/pages/career-services-page-8.jpg' },
];

export default function EmploymentSupportPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Video hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden bg-slate-900">
        <video autoPlay muted loop playsInline poster="/images/pages/career-services-hero.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-65">
          <source src="/videos/career-services-hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Career Services</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">Employment Support</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Training is only half the equation. We connect you to employers, prepare you for interviews, and support you through your first job — all included with enrollment.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Apply Now <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/programs" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              View Programs
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {OUTCOMES.map(({ stat, label }) => (
            <div key={stat} className="text-center">
              <p className="text-brand-red-400 font-extrabold text-2xl">{stat}</p>
              <p className="text-slate-400 text-xs mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">What's Included</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Career Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map(({ title, desc, img, alt }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={img} alt={alt} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 right-4 font-bold text-white text-sm leading-tight">{title}</h3>
                </div>
                <div className="p-4 flex-1">
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Your Path</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">From Enrollment to Employment</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc, img }) => (
              <div key={n} className="flex flex-col">
                <div className="relative h-40 rounded-xl overflow-hidden mb-3 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="300px" className="object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-brand-red-600 text-white font-extrabold text-sm flex items-center justify-center shadow">{n}</div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA split */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">Ready to Start?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Your Career Starts Here</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Apply to a program and career services begin immediately. We work with you from day one through your first job offer.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/apply/student" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Apply Now <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/programs" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  View Programs
                </Link>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/career-services-page-9.jpg" alt="Career services at Elevate" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
