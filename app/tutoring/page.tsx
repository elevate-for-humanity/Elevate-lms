'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createBrowserClient } from '@supabase/ssr';
import {
  ArrowRight, ChevronDown, ChevronUp, Phone,
  Clock, Users, Video, Calendar, BookOpen, GraduationCap
} from 'lucide-react';

export default function TutoringPage() {
  const [dbTutors, setDbTutors] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('profiles').select('id, full_name, avatar_url, role').eq('role', 'instructor').limit(10)
      .then(({ data }) => { if (data) setDbTutors(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const subjects = [
    {
      title: "Healthcare & CNA",
      description: "Anatomy review, medical terminology, patient care procedures, clinical skills practice, and state exam preparation for CNA certification.",
      image: "/images/pages/training-classroom.jpg"
    },
    {
      title: "Skilled Trades",
      description: "Electrical theory, NEC code review, welding technique coaching, HVAC system troubleshooting, plumbing calculations, and blueprint reading.",
      image: "/images/pages/hvac-technician.jpg"
    },
    {
      title: "Technology & IT",
      description: "CompTIA A+ and Network+ exam prep, cybersecurity concepts, help desk scenarios, coding fundamentals, and web development projects.",
      image: "/images/pages/training-classroom.jpg"
    },
    {
      title: "Business & Finance",
      description: "QuickBooks operations, bookkeeping fundamentals, tax preparation concepts, business plan development, and Microsoft Office proficiency.",
      image: "/images/pages/training-classroom.jpg"
    },
    {
      title: "General Academic Support",
      description: "Math fundamentals, reading comprehension, study skills, test-taking strategies, and GED preparation for students who need foundational support.",
      image: "/images/pages/training-classroom.jpg"
    },
    {
      title: "Certification Exam Prep",
      description: "Focused review sessions for any certification exam — OSHA, AWS, QuickBooks, CompTIA, AFSP, or state licensing boards. Practice tests and targeted review.",
      image: "/images/pages/training-classroom.jpg"
    }
  ];

  const faqs = [
    {
      question: "Who are the tutors?",
      answer: "Tutors are program instructors, industry professionals, and trained peer tutors (advanced students who have completed the program and passed their certifications). All tutors are vetted by Elevate staff and matched to your specific program and learning needs."
    },
    {
      question: "How do I schedule a session?",
      answer: "Log in to the LMS and navigate to Help > Tutoring. Select your subject area, choose an available tutor, and pick a time slot. Sessions can be booked up to 2 weeks in advance. Same-day sessions are available when tutors have openings."
    },
    {
      question: "Is tutoring included in my tuition?",
      answer: "Yes. All enrolled students receive up to 3 tutoring sessions per week at no additional cost. Sessions are 30 or 60 minutes depending on the subject. Additional sessions beyond 3 per week may be available based on tutor availability."
    },
    {
      question: "Can I get tutoring for certification exam prep?",
      answer: "Absolutely. Exam prep is one of our most requested tutoring subjects. Tutors will review practice exams with you, identify weak areas, and create a targeted study plan. Many students schedule intensive tutoring in the 2 weeks before their certification exam."
    },
    {
      question: "Are virtual sessions available?",
      answer: "Yes. All tutoring sessions are available via Zoom. In-person sessions are also available at the Indianapolis training center during staffed hours. Virtual sessions use screen sharing for hands-on subjects like QuickBooks or coding."
    },
    {
      question: "What if I need help outside of scheduled sessions?",
      answer: "The LMS has a discussion forum where you can post questions anytime. Instructors and peer tutors monitor the forums and typically respond within 24 hours. For urgent questions, use the LMS chat feature during business hours."
    }
  ];

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Student Portal', href: '/student-portal' },
            { label: 'Resources', href: '/student-portal/resources' },
            { label: 'Tutoring Center' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image src="/images/pages/tutoring-page-1.jpg" alt="Students receiving one-on-one tutoring at Elevate training center" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tutoring Center</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            One-on-one and small group tutoring for every program we offer. Work with instructors and trained peer tutors on coursework, skills practice, and certification exam preparation. Up to 3 sessions per week included with your enrollment.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How Tutoring Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Log In to LMS", desc: "Access the tutoring portal through your student dashboard. Navigate to Help > Tutoring.", image: "/images/pages/training-classroom.jpg" },
              { step: "2", title: "Choose Your Subject", desc: "Select from healthcare, trades, technology, business, academic support, or exam prep.", image: "/images/pages/training-classroom.jpg" },
              { step: "3", title: "Book a Session", desc: "Pick an available tutor and time slot. Choose 30 or 60 minutes, virtual or in-person.", image: "/images/pages/training-classroom.jpg" },
              { step: "4", title: "Meet & Learn", desc: "Join your session via Zoom or at the training center. Get focused help on exactly what you need.", image: "/images/pages/training-classroom.jpg" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{item.step}</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subject Areas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Subject Areas</h2>
            <p className="text-gray-600">Tutoring is available for every program and certification we offer.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subjects.map((subject, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={subject.image} alt={subject.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{subject.title}</h3>
                  <p className="text-gray-600 text-sm">{subject.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white transition"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Help With Your Coursework?</h2>
          <p className="text-lg text-brand-blue-100 mb-8">Log in to the LMS to book a tutoring session, or contact support if you need assistance.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/support" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-white transition text-lg shadow-lg">
              Go to LMS <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white">
              <Phone className="w-5 h-5" /> Contact Support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
