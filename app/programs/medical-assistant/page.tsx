'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
  Stethoscope, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Heart, ClipboardList,
  Syringe, Activity, Building, UserCheck
} from 'lucide-react';

export default function MedicalAssistantProgramPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('programs').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does a Medical Assistant do?",
      answer: "Medical Assistants perform both clinical and administrative tasks in healthcare settings. Clinical duties include taking vital signs, preparing patients for exams, assisting with procedures, and administering medications. Administrative duties include scheduling, medical records, billing, and patient communication."
    },
    {
      question: "Do I need healthcare experience to enroll?",
      answer: "No prior healthcare experience is required. We teach everything from medical terminology to clinical procedures. A genuine interest in helping patients and attention to detail are the most important qualities."
    },
    {
      question: "What certifications will I earn?",
      answer: "You'll be prepared for the Certified Medical Assistant (CMA) exam through AAMA or the Registered Medical Assistant (RMA) through AMT. You'll also earn CPR/BLS certification and may add phlebotomy certification."
    },
    {
      question: "How long is the program?",
      answer: "The program is 21 days of intensive classroom instruction, lab practice, and competency-based training. You'll earn CCHW, CPR, and Rise Up credentials. Total training cost is $4,325. INTraining Program ID: #10004639."
    },
    {
      question: "Where do Medical Assistants work?",
      answer: "Medical Assistants work in physician offices, outpatient clinics, urgent care centers, hospitals, specialty practices, and community health centers. The variety of settings means you can find a work environment that fits your preferences."
    },
    {
      question: "What's the job outlook?",
      answer: "Medical Assistant is one of the fastest-growing occupations. The Bureau of Labor Statistics projects 14% growth through 2032 - much faster than average. Healthcare expansion and an aging population drive this demand."
    },
    {
      question: "What's the salary potential?",
      answer: "Entry-level Medical Assistants in Indiana earn $32,000-$38,000. With certification and experience, salaries reach $40,000-$48,000. Specialized MAs in surgery or cardiology can earn more. Benefits packages in healthcare are typically strong."
    },
    {
      question: "Can I advance my career from Medical Assistant?",
      answer: "Absolutely. Many MAs advance to office managers, clinical supervisors, or specialized roles. Others use MA experience as a foundation for nursing, physician assistant, or other healthcare degrees."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Medical Terminology & Anatomy",
      topics: ["Medical word building and abbreviations", "Body systems and organs", "Common diseases and conditions", "Medical documentation standards"],
      project: "Master 500+ medical terms and abbreviations"
    },
    {
      week: "Weeks 3-4",
      title: "Administrative Procedures",
      topics: ["Patient scheduling and registration", "Medical records management", "Insurance and billing basics", "HIPAA compliance and privacy"],
      project: "Process patient intake and schedule appointments"
    },
    {
      week: "Weeks 5-6",
      title: "Clinical Fundamentals",
      topics: ["Vital signs measurement", "Patient positioning and draping", "Infection control and sterilization", "Medical asepsis techniques"],
      project: "Accurately measure and document vital signs"
    },
    {
      week: "Weeks 7-8",
      title: "Clinical Procedures",
      topics: ["Assisting with physical exams", "Specimen collection techniques", "Wound care and bandaging", "Medication administration basics"],
      project: "Assist with complete patient examination"
    },
    {
      week: "Weeks 9-10",
      title: "Phlebotomy & Lab Procedures",
      topics: ["Venipuncture techniques", "Capillary puncture", "Specimen handling and processing", "Point-of-care testing"],
      project: "Perform successful blood draws"
    },
    {
      week: "Weeks 11-12",
      title: "EKG & Diagnostic Testing",
      topics: ["12-lead EKG placement and recording", "Pulmonary function testing", "Vision and hearing screening", "Diagnostic equipment operation"],
      project: "Perform and document EKG procedure"
    },
    {
      week: "Weeks 13-14",
      title: "Pharmacology & Injections",
      topics: ["Drug classifications and actions", "Prescription processing", "Injection techniques (IM, SubQ, ID)", "Medication safety protocols"],
      project: "Administer injections on simulation models"
    },
    {
      week: "Weeks 15-20",
      title: "Clinical Externship",
      topics: ["160+ hours at healthcare facility", "Real patient interaction", "Professional workplace experience", "Certification exam preparation"],
      project: "Complete externship and pass CMA/RMA exam"
    }
  ];

  const stats = [
    { value: "14%", label: "Job Growth Rate", icon: TrendingUp },
    { value: "$38K", label: "Average Starting Salary", icon: DollarSign },
    { value: "21 Days", label: "Program Duration", icon: Calendar },
    { value: "92%", label: "Job Placement Rate*", icon: Briefcase }
  ];

  return (
    <>
      <ProgramHeroBanner videoSrc="/videos/healthcare-cna.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Healthcare', href: '/programs/healthcare' },
            { label: 'Medical Assistant' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Become a Certified <span className="text-rose-300"> Medical Assistant</span></h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">Launch your healthcare career helping patients and supporting physicians. Learn clinical and administrative skills for one of the <strong className="text-white">fastest-growing healthcare roles.</strong></p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-center">
                <stat.icon className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">*Based on program graduates who completed career services and responded to follow-up surveys. Employment defined as working in a related field within 90 days of program completion. Results vary by individual.</p>
        </div>
      </section>

      {/* Why Medical Assistant */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-rose-100 text-rose-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why Medical Assistant?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">The Heart of Healthcare</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Medical Assistants are essential to patient care. You'll make a difference every day.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Help Patients Daily", description: "Be the friendly face patients see. Comfort anxious patients, answer questions, and ensure they receive quality care." },
              { icon: TrendingUp, title: "Rapid Job Growth", description: "14% projected growth through 2032. Healthcare expansion means consistent demand for qualified Medical Assistants." },
              { icon: Building, title: "Work Anywhere", description: "Physician offices, clinics, hospitals, urgent care, specialty practices. Choose the setting that fits your lifestyle." },
              { icon: ClipboardList, title: "Variety of Tasks", description: "No two days are the same. Mix of clinical procedures, patient interaction, and administrative work keeps things interesting." },
              { icon: UserCheck, title: "Quick Entry to Healthcare", description: "Start your healthcare career in months, not years. MA is a proven pathway to nursing and other advanced roles." },
              { icon: Activity, title: "Job Security", description: "Healthcare is recession-resistant. People always need medical care, ensuring stable employment opportunities." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="curriculum" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Training Program</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">20-Week Medical Assistant Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Comprehensive training including clinical externship. Graduate ready for CMA certification.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-rose-600 rounded-2xl flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0 mt-2" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-rose-700">Milestone:</span>
                      <span className="text-sm text-rose-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Common Questions</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === index && <div className="px-6 pb-5"><p className="text-gray-600 leading-relaxed">{faq.answer}</p></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-rose-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Your Healthcare Career?</h2>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">Join a rewarding profession helping patients every day. Check your eligibility for free WIOA-funded training.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=medical-assistant" className="inline-flex items-center justify-center px-8 py-4 bg-white text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-all transform hover:scale-105 shadow-lg">
              Register at Indiana Career Connect<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/inquiry?program=medical-assistant" className="inline-flex items-center justify-center px-8 py-4 bg-rose-700 hover:bg-rose-600 text-white font-semibold rounded-full transition-all">
              <ArrowRight className="w-5 h-5 mr-2" />Get Free Info
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
