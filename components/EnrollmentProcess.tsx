import Image from 'next/image';
import Link from 'next/link';

const steps = [
  {
    num: 1,
    title: 'Visit Indiana Career Connect',
    desc: 'Go to indianacareerconnect.com and create your free account. This is the official portal for all WIOA-funded training programs in Indiana.',
    cta: { label: 'Go to Indiana Career Connect \u2192', href: 'https://www.indianacareerconnect.com', external: true },
    image: '/images/heroes-hq/how-it-works-hero.jpg',
    alt: 'Indiana Career Connect registration process',
  },
  {
    num: 2,
    title: 'Complete Your Profile',
    desc: 'Fill out your profile with your work history, education, and career goals. This helps match you with the right training program and funding.',
    note: 'What you\u2019ll need: Social Security Number, proof of residency, income documentation (if applicable), and high school diploma or GED.',
    image: '/images/heroes-hq/career-services-hero.jpg',
    alt: 'Student completing enrollment profile',
  },
  {
    num: 3,
    title: 'Schedule Your Appointment',
    desc: 'Book an appointment with a career advisor through Indiana Career Connect. They will review your eligibility for WIOA funding and help you choose the right program.',
    options: [
      { icon: '\uD83D\uDCCD', label: 'In-Person', sub: 'Visit a WorkOne center near you' },
      { icon: '\uD83D\uDCBB', label: 'Virtual', sub: 'Schedule a video call appointment' },
    ],
    image: '/images/heroes-hq/contact-hero.jpg',
    alt: 'Career advisor meeting with student',
  },
  {
    num: 4,
    title: 'Meet with Your Advisor',
    desc: 'Your career advisor will verify your eligibility, explain funding options, and help you select Elevate for Humanity as your training provider. They can also discuss supportive services like transportation and childcare assistance.',
    note: 'Mention you want to train with Elevate for Humanity. We\u2019re an approved WIOA provider in Marion County.',
    image: '/images/heroes-hq/employer-hero.jpg',
    alt: 'Workforce advisor reviewing training options',
  },
  {
    num: 5,
    title: 'Get Approved & Enroll',
    desc: 'Once approved for WIOA funding, your advisor will issue a training voucher. Bring this to Elevate for Humanity to complete your enrollment. We handle all the paperwork and get you started.',
    cta: { label: 'Contact Us for Help', href: '/contact', external: false },
    image: '/images/heroes-hq/success-hero.jpg',
    alt: 'Student celebrating enrollment approval',
  },
];

export default function EnrollmentProcess() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Enrollment Guide</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            How to Enroll &mdash; Step by Step
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Follow these steps to start your free training through Indiana Career Connect.
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <div key={step.num} className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-center`}>
                {/* Image */}
                <div className="w-full md:w-5/12 flex-shrink-0">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                        {step.num}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-7/12">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {step.desc}
                  </p>

                  {step.note && (
                    <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-4 rounded mb-4">
                      <p className="text-sm text-slate-700">{step.note}</p>
                    </div>
                  )}

                  {step.options && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {step.options.map((opt) => (
                        <div key={opt.label} className="bg-slate-50 p-3 rounded-lg text-center">
                          <span className="text-2xl block mb-1">{opt.icon}</span>
                          <p className="font-semibold text-slate-900 text-sm">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.sub}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.cta && (
                    step.cta.external ? (
                      <a
                        href={step.cta.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-brand-blue-700 transition-all"
                      >
                        {step.cta.label}
                      </a>
                    ) : (
                      <Link
                        href={step.cta.href}
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-brand-blue-700 transition-all"
                      >
                        {step.cta.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Link href="/wioa-eligibility" className="group bg-slate-50 rounded-xl p-6 text-center hover:shadow-md transition-all border border-slate-200 hover:border-brand-blue-300">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">Eligibility Requirements</h4>
            <p className="text-sm text-slate-500">Check if you qualify for WIOA funding</p>
          </Link>
          <a href="https://www.in.gov/dwd/workone-centers/" target="_blank" rel="noopener noreferrer" className="group bg-slate-50 rounded-xl p-6 text-center hover:shadow-md transition-all border border-slate-200 hover:border-brand-blue-300">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">Find WorkOne Center</h4>
            <p className="text-sm text-slate-500">Locate your nearest WorkOne office</p>
          </a>
          <Link href="/funding" className="group bg-slate-50 rounded-xl p-6 text-center hover:shadow-md transition-all border border-slate-200 hover:border-brand-blue-300">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">Funding Options</h4>
            <p className="text-sm text-slate-500">Learn about WIOA, WRG, and JRI funding</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
