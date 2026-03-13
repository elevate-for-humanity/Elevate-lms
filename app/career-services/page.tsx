
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import PageVideoHero from '@/components/ui/PageVideoHero';
import SkillsGapAnalysis from '@/components/SkillsGapAnalysis';
import VirtualCareerFair from '@/components/VirtualCareerFair';
import { StudentSuccessCoaching } from '@/components/StudentSuccessCoaching';
import WorkOneLocator from '@/components/WorkOneLocator';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services' },
  title: 'Career Services | Elevate For Humanity',
  description: 'Resume building, interview prep, job fairs, and direct employer connections. We help you get hired after training.',
};

export default function CareerServicesPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services' }]} />
        </div>
      </div>

      <PageVideoHero
        videoSrc="/videos/career-services-hero.mp4"
        posterSrc="/images/pages/career-services-hero.jpg"
        posterAlt="Career services — job placement and coaching"
        size="marketing"
      />

      {/* What We Offer — stacked on mobile */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">What You Get</h2>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-5">
            {[
              { title: 'Resume Building', desc: 'Work one-on-one with a career advisor to build a professional resume tailored to your industry. We format, proofread, and optimize for applicant tracking systems.', image: '/images/pages/resume-building-hero.jpg' },
              { title: 'Interview Preparation', desc: 'Practice with mock interviews, get feedback on your answers, and learn how to present yourself confidently. We cover behavioral, technical, and situational questions.', image: '/images/pages/resume-building-hero.jpg' },
              { title: 'Job Fairs & Hiring Events', desc: 'Attend exclusive hiring events where our employer partners interview and hire on the spot. We host events monthly across Indiana.', image: '/images/pages/resume-building-hero.jpg' },
              { title: 'Direct Employer Connections', desc: 'We match you with employers in your field who are actively hiring. Many of our graduates receive job offers before they finish training.', image: '/images/pages/career-services-hero.jpg' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 sm:flex-col rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="relative w-28 h-28 sm:w-full sm:h-[180px] flex-shrink-0 sm:flex-shrink overflow-hidden">
                  <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="py-3 pr-3 sm:p-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Journey — step by step */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">Your Path to Employment</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Complete Your Training', desc: 'Finish your certification program and earn your credential.' },
              { step: '2', title: 'Build Your Resume', desc: 'Meet with a career advisor to create a professional resume.' },
              { step: '3', title: 'Practice Interviewing', desc: 'Do mock interviews and get feedback from hiring professionals.' },
              { step: '4', title: 'Connect With Employers', desc: 'We introduce you to employers hiring in your field.' },
              { step: '5', title: 'Get Hired', desc: 'Interview, receive an offer, and start your new career.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Gap Analysis */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SkillsGapAnalysis />
        </div>
      </section>

      {/* Virtual Career Fair */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <VirtualCareerFair />
        </div>
      </section>

      {/* Student Success Coaching */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <StudentSuccessCoaching />
        </div>
      </section>

      {/* WorkOne Locator */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <WorkOneLocator />
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Ready to Start Your Career?</h2>
          <p className="text-white mb-6 text-sm">Apply for training and career services are included at no extra cost.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/start" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/programs" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
