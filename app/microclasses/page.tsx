import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Award, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import {
  HSI_COURSES,
  NRF_COURSES,
  type PartnerCourse,
} from '@/lib/partners/link-based-integration';

export const metadata: Metadata = {
  title: 'Microclasses | Elevate for Humanity',
  description: 'Job-ready certifications in hours. CPR, First Aid, ServSafe and more. Free with WIOA or pay as low as $18.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/microclasses',
  },
};

const SECTIONS = [
  { id: 'healthcare', label: 'Healthcare',   partner: 'Health & Safety Institute',       courses: HSI_COURSES },
  { id: 'food',       label: 'Food Service', partner: 'National Restaurant Foundation',  courses: NRF_COURSES },
];

function CourseCard({ course }: { course: PartnerCourse }) {
  const isFree = course.retailPrice === 0;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{course.title}</h3>
        {isFree ? (
          <span className="shrink-0 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">Free / WIOA</span>
        ) : (
          <span className="shrink-0 text-sm font-bold text-slate-900">${course.retailPrice}</span>
        )}
      </div>
      <p className="text-xs text-slate-500 mb-4 flex-1">{course.description}</p>
      <div className="space-y-1 mb-5">
        <div className="flex items-center gap-2 text-xs text-slate-400"><Clock className="w-3 h-3" />{course.duration}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400"><Award className="w-3 h-3" />{course.certificationType}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="w-3 h-3" />{course.partnerName}</div>
      </div>
      {isFree ? (
        <Link href="/apply/student" className="block text-center bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
          Apply — Free with WIOA
        </Link>
      ) : (
        <div className="space-y-2">
          <a href={course.paymentLink} target="_blank" rel="noopener noreferrer"
            className="block text-center bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors">
            Enroll Now — ${course.retailPrice}
          </a>
          <p className="text-center text-xs text-slate-400">
            Free with WIOA?{' '}
            <Link href="/apply/student" className="underline text-slate-600">Apply here</Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function MicroclassesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block bg-white/15 text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">Quick Certifications</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Microclasses</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Job-ready certifications in hours, not months. Free through WIOA for eligible Indiana residents — or pay as low as $18 out of pocket.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" />1–16 hours</div>
            <div className="flex items-center gap-2"><Award className="w-4 h-4" />Industry-recognized certificates</div>
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" />Start immediately after payment</div>
          </div>
        </div>
      </section>

      {/* WIOA Banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-900 font-medium">
              All courses are <strong>free for eligible Indiana residents</strong> through WIOA / WorkOne funding.
            </p>
          </div>
          <Link href="/apply/student" className="shrink-0 text-xs font-bold text-green-800 bg-green-200 hover:bg-green-300 px-4 py-2 rounded-full transition-colors">
            Check WIOA Eligibility →
          </Link>
        </div>
      </div>

      {/* Course Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {SECTIONS.map((section) => (
          <div key={section.id}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">{section.label}</h2>
              <p className="text-sm text-slate-500 mt-0.5">via {section.partner}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {section.courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Partner / Full Programs */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Full Apprenticeship Programs</h2>
            <p className="text-sm text-slate-500 mt-1">
              DOL-registered apprenticeship programs that include micro-class certifications as part of the curriculum.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Barbershop Apprenticeship',   href: '/programs/barber-apprenticeship',       cert: 'Indiana Barber License',         duration: '12–18 months' },
              { title: 'Cosmetology Apprenticeship',  href: '/programs/cosmetology-apprenticeship',  cert: 'Indiana Cosmetology License',    duration: '12–18 months' },
              { title: 'HVAC Technician',             href: '/programs/hvac-technician',             cert: 'EPA 608 + HVAC Certification',   duration: '6–12 months'  },
              { title: 'Electrical Apprenticeship',   href: '/programs/electrical',                  cert: 'Journeyman Electrician',         duration: '12–24 months' },
              { title: 'Plumbing Apprenticeship',     href: '/programs/plumbing',                    cert: 'Journeyman Plumber',             duration: '12–24 months' },
              { title: 'Welding',                     href: '/programs/welding',                     cert: 'AWS Welding Certification',      duration: '6–12 months'  },
              { title: 'CDL Training',                href: '/programs/cdl-training',                cert: 'Class A CDL',                    duration: '4–8 weeks'    },
              { title: 'CNA Certification',           href: '/programs/cna',                         cert: 'Indiana CNA License',            duration: '6–8 weeks'    },
            ].map((prog) => (
              <Link key={prog.href} href={prog.href}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:shadow-sm transition-all group flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{prog.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{prog.cert}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{prog.duration}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Not sure where to start?</h2>
          <p className="text-slate-500 text-sm mb-6">Our team will help you find the right certification and funding option for your goals.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors">Talk to an Advisor</Link>
            <Link href="/apply/student" className="border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">Apply for WIOA Funding</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
