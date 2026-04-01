import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Play, BookOpen, Award, Clock, Users, FileText, Wrench } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'HVAC Technician Course License | Elevate Store',
  description: 'License the complete 640-hour HVAC Technician course for your workforce program, community college, or training center. 16 modules, 94 lessons, EPA 608, OSHA 10, CPR/AED.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/courses/hvac-technician-course-license' },
};

const MODULES = [
  { num: 1, title: 'HVAC System Overview', lessons: 6, topics: 'System components, refrigeration cycle fundamentals, safety protocols' },
  { num: 2, title: 'Refrigerants & EPA 608 Core', lessons: 7, topics: 'Refrigerant types, ozone depletion, Clean Air Act, certification requirements' },
  { num: 3, title: 'EPA 608 Type I — Small Appliances', lessons: 5, topics: 'Recovery techniques, equipment requirements, disposal procedures' },
  { num: 4, title: 'EPA 608 Type II — High-Pressure Systems', lessons: 7, topics: 'Leak detection, repair requirements, recovery equipment, record-keeping' },
  { num: 5, title: 'EPA 608 Type III — Low-Pressure Systems', lessons: 5, topics: 'Chiller systems, purge units, leak rates, recovery procedures' },
  { num: 6, title: 'Electrical Fundamentals', lessons: 6, topics: 'Circuits, wiring diagrams, multimeter use, control systems' },
  { num: 7, title: 'Heating Systems', lessons: 6, topics: 'Gas furnaces, heat pumps, combustion analysis, heat exchangers' },
  { num: 8, title: 'Cooling Systems', lessons: 6, topics: 'Split systems, condensers, evaporators, airflow measurement' },
  { num: 9, title: 'Ductwork & Air Distribution', lessons: 5, topics: 'Duct design, static pressure, balancing, IAQ' },
  { num: 10, title: 'Controls & Thermostats', lessons: 6, topics: 'Thermostat wiring, smart controls, BAS integration, troubleshooting' },
  { num: 11, title: 'Troubleshooting & Diagnostics', lessons: 7, topics: 'Systematic diagnosis, pressure-temperature charts, service calls' },
  { num: 12, title: 'Preventive Maintenance', lessons: 5, topics: 'PM schedules, coil cleaning, filter replacement, documentation' },
  { num: 13, title: 'Commercial Systems', lessons: 6, topics: 'RTUs, chillers, cooling towers, commercial controls' },
  { num: 14, title: 'Heat Pumps & Geothermal', lessons: 5, topics: 'Heat pump operation, reversing valves, geothermal loops' },
  { num: 15, title: 'Business & Career Skills', lessons: 5, topics: 'Customer service, invoicing, licensing requirements, career pathways' },
  { num: 16, title: 'Capstone & Certification Prep', lessons: 7, topics: 'EPA 608 Universal exam prep, OSHA 10, CPR/AED, final assessment' },
];

const VIDEO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-videos/hvac/hvac-module1-lesson1.mp4`;

export default function HvacCourseLicensePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Store', href: '/store' },
          { label: 'Courses', href: '/store/courses' },
          { label: 'HVAC Technician Course License' },
        ]} />
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-3">Licensable Course Content</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                HVAC Technician<br />Full Course License
              </h1>
              <p className="text-slate-300 text-lg mb-6">
                License our complete 640-hour HVAC Technician course for delivery at your organization. 16 modules, 94 lessons, interactive diagrams, EPA 608 prep, OSHA 10, and CPR/AED — ready to deploy.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { icon: BookOpen, label: '16 Modules · 94 Lessons' },
                  { icon: Clock, label: '640 Hours' },
                  { icon: Award, label: 'EPA 608 · OSHA 10 · CPR/AED' },
                  { icon: Users, label: 'Min. 10 Students' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-slate-800 text-slate-300 text-sm px-3 py-1.5 rounded-full">
                    <Icon className="w-4 h-4 text-brand-red-400" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact?topic=hvac-course-license"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition"
                >
                  Request Licensing Info
                </Link>
                <Link
                  href="/course-preview/hvac-technician"
                  className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-semibold px-6 py-3 rounded-lg transition"
                >
                  <Play className="w-4 h-4" /> Preview Full Course
                </Link>
              </div>
            </div>

            {/* Video preview */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black">
              <video
                className="w-full h-full object-contain"
                controls
                preload="metadata"
                poster="/images/pages/hvac-technician.jpg"
              >
                <source src={VIDEO_URL} type="video/mp4" />
              </video>
              <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                Module 1, Lesson 1 — Sample
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-12 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-1">Single Organization</h3>
              <div className="mb-3">
                <span className="text-3xl font-black text-slate-900">$4,500</span>
                <span className="text-slate-500 text-sm ml-1">/ year</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">Up to 50 active students. Delivered via your Elevate LMS instance or SCORM export.</p>
              <Link href="/contact?topic=hvac-course-license&tier=single" className="block text-center bg-brand-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-brand-red-700 transition text-sm">
                Get Started
              </Link>
            </div>
            <div className="bg-white rounded-2xl border-2 border-brand-red-600 p-6 relative">
              <span className="absolute -top-3 left-6 bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
              <h3 className="font-bold text-slate-900 mb-1">Workforce Network</h3>
              <div className="mb-3">
                <span className="text-3xl font-black text-slate-900">$9,500</span>
                <span className="text-slate-500 text-sm ml-1">/ year</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">Up to 5 sites, unlimited students. Includes instructor training and quarterly content updates.</p>
              <Link href="/contact?topic=hvac-course-license&tier=network" className="block text-center bg-brand-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-brand-red-700 transition text-sm">
                Get Started
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-1">State / Enterprise</h3>
              <div className="mb-3">
                <span className="text-3xl font-black text-slate-900">Custom</span>
              </div>
              <p className="text-slate-600 text-sm mb-4">Statewide deployment, custom branding, SCORM/xAPI integration, and white-label options.</p>
              <Link href="/contact?topic=hvac-course-license&tier=enterprise" className="block text-center border border-slate-300 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-white transition text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">What&apos;s included</h2>
          <p className="text-slate-600 mb-10">Every license includes the complete course package — no add-ons, no per-student fees.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, title: '94 Structured Lessons', desc: '16 modules organized by skill progression. Each lesson includes reading content, video, lab activity, and quiz.' },
              { icon: Wrench, title: 'Interactive Diagrams', desc: 'Refrigeration cycle, EPA 608 P-T charts, electrical wiring, duct distribution, and troubleshooting flowcharts — all interactive.' },
              { icon: Award, title: 'EPA 608 Prep', desc: 'Core, Type I, Type II, and Type III sections with 400+ practice questions and timed mock exams.' },
              { icon: FileText, title: 'Instructor Materials', desc: 'Lesson plans, slide decks, lab guides, and a complete instructor manual for each module.' },
              { icon: Users, title: 'Assessment Bank', desc: '400+ questions across all modules. Randomized quizzes, module exams, and a final certification readiness assessment.' },
              { icon: Clock, title: 'SCORM / xAPI Export', desc: 'Deploy in your existing LMS. Full SCORM 1.2 and xAPI (Tin Can) packages included with every license.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-slate-200">
                <item.icon className="w-5 h-5 text-brand-red-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Module list */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Course curriculum</h2>
          <p className="text-slate-600 mb-8">16 modules · 94 lessons · 640 hours</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODULES.map((mod) => (
              <div key={mod.num} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-brand-red-100 text-brand-red-700 font-black text-sm flex items-center justify-center flex-shrink-0">
                  {mod.num}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{mod.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{mod.lessons} lessons · {mod.topics}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials covered */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Credentials students earn</h2>
          <p className="text-slate-600 mb-8">The course prepares students for three industry-recognized credentials.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                credential: 'EPA Section 608 Universal',
                issuer: 'ESCO Institute / Mainstream Engineering (EPA-approved)',
                desc: 'Required by federal law to purchase and handle refrigerants. Covers all four sections: Core, Type I, Type II, Type III.',
                img: '/images/pages/hvac-technician.jpg',
              },
              {
                credential: 'OSHA 10-Hour',
                issuer: 'CareerSafe / OSHA-authorized trainer',
                desc: 'Workplace safety fundamentals recognized by employers nationwide. DOL card issued upon completion.',
                img: '/images/pages/trades-classroom.jpg',
              },
              {
                credential: 'CPR/AED',
                issuer: 'American Heart Association or Red Cross',
                desc: 'Hands-on CPR and AED certification. Required by many HVAC employers and apprenticeship programs.',
                img: '/images/pages/cpr-mannequin.jpg',
              },
            ].map((c) => (
              <div key={c.credential} className="rounded-xl overflow-hidden border border-slate-200">
                <div className="relative h-36">
                  <Image src={c.img} alt={c.credential} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-900 text-sm">{c.credential}</p>
                  <p className="text-xs text-brand-red-600 font-medium mt-0.5 mb-2">{c.issuer}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Who licenses this course</h2>
          <p className="text-slate-400 mb-10">Any organization delivering workforce training can license and deploy this curriculum.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Workforce Boards', desc: 'Deploy for WIOA Title I participants. Meets ETPL curriculum standards.' },
              { title: 'Community Colleges', desc: 'Add to your trades catalog. SCORM export integrates with Blackboard, Canvas, Moodle.' },
              { title: 'Apprenticeship Programs', desc: 'Use as the related technical instruction (RTI) component of a DOL Registered Apprenticeship.' },
              { title: 'Reentry Programs', desc: 'Designed for adult learners. Used by Job Ready Indy and justice-involved workforce programs.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-start gap-2 mb-2">
                  <Check className="w-4 h-4 text-brand-green-400 flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to license?</h2>
          <p className="text-red-100 mb-8">
            Contact us to discuss your cohort size, deployment timeline, and integration requirements. Most organizations are live within two weeks.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact?topic=hvac-course-license"
              className="inline-flex items-center gap-2 bg-white text-brand-red-700 font-bold px-8 py-3 rounded-lg hover:bg-red-50 transition"
            >
              Request Licensing Info
            </Link>
            <Link
              href="/course-preview/hvac-technician"
              className="inline-flex items-center gap-2 border-2 border-white/60 text-white font-semibold px-8 py-3 rounded-lg hover:border-white transition"
            >
              <Play className="w-4 h-4" /> Preview the Course
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
