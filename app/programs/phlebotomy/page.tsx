'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, CheckCircle, ArrowRight, 
  Droplet, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Heart, TestTube,
  Building, Shield, Activity, Syringe
} from 'lucide-react';

export default function PhlebotomyProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does a Phlebotomist do?",
      answer: "Phlebotomists are trained to draw blood from patients for medical testing, transfusions, donations, or research. They also prepare specimens for laboratory analysis, maintain equipment, and ensure patient comfort during the procedure."
    },
    {
      question: "Is phlebotomy hard to learn?",
      answer: "Phlebotomy requires practice and precision, but it's very learnable. Most students become proficient within weeks of hands-on training. The key is developing good technique, patient communication skills, and attention to safety protocols."
    },
    {
      question: "Do I need to be certified?",
      answer: "While Indiana doesn't require state licensure, most employers prefer or require national certification. Our program prepares you for certification through ASCP, NHA, or AMT. Certification significantly improves job prospects and starting pay."
    },
    {
      question: "How long is the training program?",
      answer: "Our phlebotomy program is 8-12 weeks, including classroom instruction, lab practice, and clinical externship. You'll perform 100+ successful venipunctures before graduation to ensure competency."
    },
    {
      question: "Where do Phlebotomists work?",
      answer: "Phlebotomists work in hospitals, diagnostic laboratories, blood donation centers, physician offices, clinics, and mobile health services. Some work for insurance companies performing health screenings."
    },
    {
      question: "What's the salary for Phlebotomists?",
      answer: "Entry-level Phlebotomists in Indiana earn $32,000-$38,000. With certification and experience, salaries reach $40,000-$45,000. Hospital positions and specialized roles (like blood bank) often pay more."
    },
    {
      question: "Is there job demand for Phlebotomists?",
      answer: "Yes! The Bureau of Labor Statistics projects 8% growth through 2032. An aging population requiring more medical tests and expanded healthcare access drive this demand. Phlebotomists are consistently needed."
    },
    {
      question: "Can I advance from Phlebotomy?",
      answer: "Phlebotomy is an excellent entry point to healthcare. Many phlebotomists advance to Medical Laboratory Technician, Medical Assistant, or nursing roles. The patient care experience is valuable for any healthcare career."
    }
  ];

  const curriculum = [
    {
      week: "Week 1",
      title: "Introduction to Phlebotomy",
      topics: ["Healthcare setting orientation", "Medical terminology basics", "Anatomy of the circulatory system", "Infection control and safety"],
      project: "Pass safety and terminology assessments"
    },
    {
      week: "Week 2",
      title: "Venipuncture Equipment",
      topics: ["Needles, tubes, and collection systems", "Order of draw and additives", "Equipment selection criteria", "Quality control procedures"],
      project: "Identify all equipment and proper order of draw"
    },
    {
      week: "Week 3",
      title: "Venipuncture Techniques",
      topics: ["Vein selection and palpation", "Site preparation and antisepsis", "Needle insertion techniques", "Proper tube filling and mixing"],
      project: "Perform venipuncture on training arms"
    },
    {
      week: "Week 4",
      title: "Capillary & Special Collections",
      topics: ["Fingerstick and heelstick procedures", "Blood culture collection", "Glucose tolerance testing", "Pediatric and geriatric considerations"],
      project: "Master capillary collection techniques"
    },
    {
      week: "Week 5",
      title: "Difficult Draws & Complications",
      topics: ["Handling difficult veins", "Managing patient anxiety", "Recognizing and preventing complications", "Hematoma prevention and care"],
      project: "Successfully handle simulated difficult scenarios"
    },
    {
      week: "Week 6",
      title: "Specimen Processing",
      topics: ["Specimen labeling requirements", "Centrifugation and aliquoting", "Storage and transport conditions", "Rejection criteria and troubleshooting"],
      project: "Process specimens according to lab protocols"
    },
    {
      week: "Weeks 7-8",
      title: "Clinical Externship",
      topics: ["100+ supervised venipunctures", "Real patient interaction", "Laboratory workflow experience", "Professional workplace conduct"],
      project: "Complete externship with documented competencies"
    },
    {
      week: "Weeks 9-12",
      title: "Certification Preparation",
      topics: ["Comprehensive review", "Practice certification exams", "Test-taking strategies", "Job search and interview prep"],
      project: "Pass national certification exam"
    }
  ];

  const stats = [
    { value: "8%", label: "Job Growth Rate", icon: TrendingUp },
    { value: "$36K", label: "Average Starting Salary", icon: DollarSign },
    { value: "12", label: "Weeks to Certified", icon: Calendar },
    { value: "100+", label: "Practice Draws", icon: Droplet }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Healthcare', href: '/programs/healthcare' },
            { label: 'Phlebotomy Technician' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Become a Certified
                <span className="text-red-300"> Phlebotomy Technician</span>
              </h1>
              
              <p className="text-xl text-red-100 mb-8 leading-relaxed">
                Master the essential healthcare skill of blood collection. 
                Start your medical career in just 12 weeks with <strong className="text-white">hands-on training and certification.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-red-300" />8-12 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />$0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Droplet className="w-4 h-4 text-red-300" />100+ Practice Draws
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply?program=phlebotomy-technician" className="inline-flex items-center justify-center px-8 py-4 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-red-500/30">
                  Check Your Eligibility<ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link href="#curriculum" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold rounded-full transition-all">
                  <Play className="w-5 h-5 mr-2" />View Curriculum
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="text-center">
                <stat.icon className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Phlebotomy */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-red-100 text-red-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why Phlebotomy?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Quick Path to Healthcare</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Phlebotomy offers the fastest entry into healthcare with strong job prospects and growth potential.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: "Fast Training", description: "Get certified in just 8-12 weeks. Start earning quickly while others are still in school." },
              { icon: Building, title: "Work Anywhere", description: "Hospitals, labs, clinics, blood banks, and mobile services. Opportunities in every community." },
              { icon: Heart, title: "Help Patients", description: "Your skill enables life-saving diagnoses and treatments. Every draw makes a difference." },
              { icon: TrendingUp, title: "Growing Field", description: "8% job growth projected. Aging population and expanded testing drive consistent demand." },
              { icon: Shield, title: "Job Security", description: "Blood tests are essential to medicine. Phlebotomists will always be needed in healthcare." },
              { icon: Activity, title: "Career Stepping Stone", description: "Use phlebotomy as a foundation for MLT, Medical Assistant, nursing, or other healthcare careers." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-red-600" />
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
            <span className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Training Program</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">12-Week Phlebotomy Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Intensive hands-on training with 100+ supervised blood draws. Graduate certification-ready.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-red-700">Milestone:</span>
                      <span className="text-sm text-red-600 ml-2">{module.project}</span>
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
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Common Questions</span>
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
      <section className="py-20 bg-red-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Your Phlebotomy Career?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">Get certified in just 12 weeks. Check your eligibility for free WIOA-funded training.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=phlebotomy-technician" className="inline-flex items-center justify-center px-8 py-4 bg-white text-red-600 font-semibold rounded-full hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg">
              Check Eligibility Now<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/inquiry?program=phlebotomy-technician" className="inline-flex items-center justify-center px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-full transition-all">
              <Phone className="w-5 h-5 mr-2" />Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
