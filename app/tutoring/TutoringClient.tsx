'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight, ChevronDown, ChevronUp, Phone,
  Clock, Users, Video, Calendar, BookOpen, GraduationCap,
} from 'lucide-react';

const subjects = [
  {
    title: 'Healthcare & CNA',
    description: 'Anatomy review, medical terminology, patient care procedures, clinical skills practice, and state exam preparation for CNA certification.',
    image: '/images/pages/cna-clinical.jpg',
  },
  {
    title: 'Skilled Trades',
    description: 'Electrical theory, NEC code review, welding technique coaching, HVAC system troubleshooting, plumbing calculations, and blueprint reading.',
    image: '/images/pages/hvac-technician.webp',
  },
  {
    title: 'Technology & IT',
    description: 'CompTIA A+ and Network+ exam prep, cybersecurity concepts, help desk scenarios, coding fundamentals, and web development projects.',
    image: '/images/pages/cybersecurity.webp',
  },
  {
    title: 'Business & Finance',
    description: 'QuickBooks operations, bookkeeping fundamentals, business plan development, and Microsoft Office proficiency.',
    image: '/images/pages/bookkeeping.webp',
  },
  {
    title: 'General Academic Support',
    description: 'Math fundamentals, reading comprehension, study skills, test-taking strategies, and GED preparation.',
    image: '/images/pages/adult-learner.webp',
  },
  {
    title: 'Certification Exam Prep',
    description: 'Focused review sessions for OSHA, AWS, QuickBooks, CompTIA, AFSP, or state licensing boards. Practice tests and targeted review.',
    image: '/images/pages/certifications.webp',
  },
];

const faqs = [
  {
    question: 'Who are the tutors?',
    answer: 'Tutors are program instructors, industry professionals, and trained peer tutors who have completed the program and passed their certifications. All tutors are vetted by Elevate staff.',
  },
  {
    question: 'How do I schedule a session?',
    answer: 'Navigate to Help > Tutoring in the LMS. Select your subject area, choose an available tutor, and pick a time slot. Sessions can be booked up to 2 weeks in advance.',
  },
  {
    question: 'Is tutoring included in my tuition?',
    answer: 'Yes. All enrolled students receive up to 3 tutoring sessions per week at no additional cost. Sessions are 30 or 60 minutes depending on the subject.',
  },
  {
    question: 'Can I get tutoring for certification exam prep?',
    answer: 'Absolutely. Tutors will review practice exams, identify weak areas, and create a targeted study plan. Many students schedule intensive tutoring in the 2 weeks before their exam.',
  },
  {
    question: 'Are virtual sessions available?',
    answer: 'Yes. All sessions are available via Zoom. In-person sessions are also available at the Indianapolis training center during staffed hours.',
  },
  {
    question: 'What if I need help outside of scheduled sessions?',
    answer: 'The LMS has a discussion forum where you can post questions anytime. Instructors and peer tutors typically respond within 24 hours.',
  },
];

export default function TutoringClient({ tutors }: { tutors: { id: string; full_name: string | null; avatar_url: string | null }[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Student Portal', href: '/learner/dashboard' },
            { label: 'Resources', href: '/lms/resources' },
            { label: 'Tutoring Center' },
          ]} />
        </div>
      </div>

      <section className="relative h-[clamp(190px,32vw,360px)] overflow-hidden">
        <Image src="/images/pages/tutoring-page-1.webp" alt="Students receiving tutoring" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Tutoring Center</h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            One-on-one and small group tutoring for every program. Work with instructors and trained peer tutors on coursework, skills practice, and certification exam preparation. Up to 3 sessions per week included with enrollment.
          </p>
        </div>
      </section>

      {/* Tutors from DB */}
      {tutors.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Available Tutors</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {tutors.map((t) => (
                <div key={t.id} className="bg-white rounded-xl p-5 border flex flex-col items-center text-center">
                  {t.avatar_url ? (
                    <Image sizes="100vw" src={t.avatar_url} alt={t.full_name ?? 'Tutor'} width={64} height={64} className="rounded-full mb-3 object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-blue-100 flex items-center justify-center mb-3">
                      <Users className="w-7 h-7 text-brand-blue-600" />
                    </div>
                  )}
                  <p className="font-semibold text-slate-900">{t.full_name ?? 'Instructor'}</p>
                  <p className="text-xs text-slate-500 mt-1">Instructor</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How Tutoring Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Log In to LMS', desc: 'Access the tutoring portal through your student dashboard.', image: '/images/pages/lms-page-1.webp' },
              { step: '2', title: 'Choose Your Subject', desc: 'Select from healthcare, trades, technology, business, or exam prep.', image: '/images/pages/courses-page-1.webp' },
              { step: '3', title: 'Book a Session', desc: 'Pick an available tutor and time slot. Choose 30 or 60 minutes.', image: '/images/pages/calendar-page-1.webp' },
              { step: '4', title: 'Meet & Learn', desc: 'Join via Zoom or at the training center.', image: '/images/pages/career-counseling.jpg' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="relative h-40 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="100vw" />
                  <div className="absolute top-3 left-3 w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{item.step}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-700 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Subject Areas</h2>
            <p className="text-slate-700">Tutoring is available for every program and certification we offer.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <Image src={s.image} alt={s.title} fill className="object-cover" sizes="100vw" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-slate-700 text-sm">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition">
                  <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-700 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-700 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-6 pb-6">
                    <p className="text-slate-700 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help With Your Coursework?</h2>
          <p className="text-lg mb-8">Log in to the LMS to book a tutoring session, or contact support.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lms/courses" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-slate-100 transition text-lg shadow-lg">
              Go to LMS <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-slate-900 font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">
              <Phone className="w-5 h-5" /> Contact Support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
