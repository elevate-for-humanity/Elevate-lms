'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight, ChevronDown, ChevronUp, Phone
} from 'lucide-react';

export default function WritingCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const services = [
    {
      title: "Course Essays & Written Assignments",
      description: "Get feedback on structure, clarity, grammar, and argument strength for any course assignment. Tutors review your draft and provide specific, actionable suggestions — not just corrections.",
      image: "/images/pages/writing-center-page-1.jpg"
    },
    {
      title: "Resume & Cover Letter Writing",
      description: "Build a professional resume tailored to your target industry. Learn how to highlight certifications, skills, and training. Cover letter templates and customization for specific job postings.",
      image: "/images/pages/writing-center-page-1.jpg"
    },
    {
      title: "Professional Communication",
      description: "Email etiquette, business letter formatting, workplace communication norms, and professional tone. Essential for office administration students and anyone entering a professional environment.",
      image: "/images/pages/writing-center-page-1.jpg"
    },
    {
      title: "Scholarship & Application Essays",
      description: "Craft compelling personal statements for scholarship applications, program admissions, and funding requests. Tutors help you tell your story effectively and meet word count requirements.",
      image: "/images/pages/writing-center-page-1.jpg"
    },
    {
      title: "Citation & Research Formatting",
      description: "APA and MLA formatting, in-text citations, reference pages, and avoiding plagiarism. Required for students completing research-based assignments or capstone projects.",
      image: "/images/pages/writing-center-page-1.jpg"
    },
    {
      title: "GED Writing Preparation",
      description: "Extended response practice for the GED Reasoning Through Language Arts test. Learn the scoring rubric, practice timed essays, and build confidence in written argumentation.",
      image: "/images/pages/writing-center-page-1.jpg"
    }
  ];

  const faqs = [
    {
      question: "How do I submit a draft for review?",
      answer: "Log in to the LMS, navigate to Help > Writing Center, and upload your document (Word, Google Docs link, or PDF). Include the assignment prompt and any specific questions you have. A writing tutor will review your draft and return detailed feedback within 48 hours."
    },
    {
      question: "Can I meet with a tutor in real time?",
      answer: "Yes. Book a 30-minute live session through the LMS tutoring portal. Sessions are available via Zoom or in-person at the Indianapolis training center. Live sessions are ideal for brainstorming, outlining, or working through revisions together."
    },
    {
      question: "Is the Writing Center only for English classes?",
      answer: "No. The Writing Center helps with any writing task — course assignments, resumes, cover letters, business plans, professional emails, scholarship essays, and even social media content for entrepreneurship students. If it involves writing, we can help."
    },
    {
      question: "Will the tutor write my paper for me?",
      answer: "No. Tutors provide feedback, suggestions, and guidance — but the writing is yours. We'll help you improve your structure, fix grammar issues, strengthen your arguments, and meet assignment requirements. The goal is to make you a better writer, not to do the work for you."
    },
    {
      question: "How many times can I use the Writing Center?",
      answer: "Enrolled students can submit up to 3 drafts per week for written review and book up to 2 live sessions per week. There's no limit on the total number of visits during your enrollment. We encourage students to use the Writing Center early and often."
    },
    {
      question: "I struggle with basic writing. Is that okay?",
      answer: "Absolutely. Many of our students are returning to education after years away. Writing tutors are trained to meet you where you are — whether that's basic sentence structure or polishing a graduate-level essay. No judgment, just support."
    }
  ];

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Student Portal', href: '/student-portal' },
            { label: 'Resources', href: '/student-portal/resources' },
            { label: 'Writing Center' }
          ]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] overflow-hidden">
        <Image src="/images/pages/writing-center-page-1.jpg" alt="Student receiving writing assistance at the Elevate Writing Center" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Intro */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Writing Center</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Get help with essays, resumes, cover letters, professional communication, and any writing assignment. Submit drafts for written feedback (48-hour turnaround) or book a live session with a writing tutor. Included with your enrollment at no extra cost.
          </p>
        </div>
      </section>

      {/* Two Options */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Two Ways to Get Help</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="relative h-56 overflow-hidden">
                <Image src="/images/pages/writing-center-page-1.jpg" alt="Student submitting a draft for written review" fill className="object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold mb-3">Submit for Written Review</h3>
                <p className="text-gray-600 mb-4">Upload your draft through the LMS. A writing tutor reviews it and returns detailed, line-by-line feedback within 48 hours. Best for polishing a near-final draft or getting a second set of eyes on your work.</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>Turnaround: 48 hours</div>
                  <div>Format: Written comments on your document</div>
                  <div>Limit: 3 submissions per week</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="relative h-56 overflow-hidden">
                <Image src="/images/pages/writing-center-page-1.jpg" alt="Live tutoring session via Zoom" fill className="object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold mb-3">Book a Live Session</h3>
                <p className="text-gray-600 mb-4">Meet one-on-one with a writing tutor via Zoom or in person. Work through your writing in real time — brainstorm ideas, build an outline, revise a draft, or practice for a timed writing exam.</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>Duration: 30 minutes per session</div>
                  <div>Format: Zoom or in-person</div>
                  <div>Limit: 2 live sessions per week</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Help With</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={service.image} alt={service.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
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
      <section className="py-20 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Writing Help?</h2>
          <p className="text-lg text-brand-blue-100 mb-8">Log in to the LMS to submit a draft or book a live session with a writing tutor.</p>
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
