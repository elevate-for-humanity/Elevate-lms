'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, Circle, ArrowRight, 
  HeartPulse, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Heart, Bed,
  Building, Shield, Activity, UserCheck
} from 'lucide-react';

export default function CNAProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does a CNA do?",
      answer: "Certified Nursing Assistants provide direct patient care under the supervision of nurses. Duties include helping patients with daily activities (bathing, dressing, eating), taking vital signs, turning and repositioning patients, and reporting changes in patient condition to nurses."
    },
    {
      question: "How long is CNA training?",
      answer: "Our CNA program is 6-8 weeks, meeting Indiana's requirement of at least 75 hours of training (including 16 hours of clinical experience). You'll be prepared to take the state competency exam upon completion."
    },
    {
      question: "What's required to become a CNA in Indiana?",
      answer: "You must complete a state-approved training program, pass a criminal background check, and pass the Indiana CNA competency exam (written test and skills demonstration). You must be at least 16 years old."
    },
    {
      question: "Where do CNAs work?",
      answer: "CNAs work in nursing homes, hospitals, assisted living facilities, home health agencies, rehabilitation centers, and hospice care. The variety of settings lets you choose an environment that matches your preferences."
    },
    {
      question: "What's the salary for CNAs?",
      answer: "Entry-level CNAs in Indiana earn $28,000-$34,000. With experience and specialty certifications, salaries reach $36,000-$42,000. Hospital CNAs and those with additional skills often earn more. Many employers offer shift differentials for nights and weekends."
    },
    {
      question: "Is there demand for CNAs?",
      answer: "Absolutely. The Bureau of Labor Statistics projects 4% growth, but the real demand is much higher due to turnover and an aging population. CNAs are consistently among the most in-demand healthcare workers."
    },
    {
      question: "Can I become a nurse after being a CNA?",
      answer: "Yes! Many nurses started as CNAs. The hands-on patient care experience is invaluable for nursing school. Some employers offer tuition assistance for CNAs pursuing nursing degrees. It's a proven pathway to RN."
    },
    {
      question: "Is CNA work physically demanding?",
      answer: "Yes, CNA work involves lifting, bending, and being on your feet for extended periods. You'll learn proper body mechanics and use assistive equipment to prevent injury. Physical fitness helps, but technique matters most."
    }
  ];

  const curriculum = [
    {
      week: "Week 1",
      title: "Introduction to Healthcare",
      topics: ["Role of the nursing assistant", "Healthcare team and communication", "Patient rights and dignity", "Infection control and hand hygiene"],
      project: "Demonstrate proper hand hygiene and PPE use"
    },
    {
      week: "Week 2",
      title: "Safety & Body Mechanics",
      topics: ["Safe patient handling techniques", "Transfer and ambulation assistance", "Fall prevention strategies", "Emergency procedures"],
      project: "Perform safe patient transfers"
    },
    {
      week: "Week 3",
      title: "Personal Care Skills",
      topics: ["Bathing and grooming assistance", "Oral care and denture care", "Dressing and undressing patients", "Toileting and incontinence care"],
      project: "Complete full personal care routine"
    },
    {
      week: "Week 4",
      title: "Vital Signs & Observations",
      topics: ["Temperature measurement", "Pulse and respiration", "Blood pressure measurement", "Recognizing and reporting changes"],
      project: "Accurately measure and document vital signs"
    },
    {
      week: "Week 5",
      title: "Nutrition & Elimination",
      topics: ["Feeding assistance techniques", "Special diets and restrictions", "Intake and output measurement", "Catheter care basics"],
      project: "Assist with meals and document I&O"
    },
    {
      week: "Week 6",
      title: "Special Populations",
      topics: ["Care for patients with dementia", "End-of-life care basics", "Mental health considerations", "Cultural sensitivity"],
      project: "Demonstrate dementia care techniques"
    },
    {
      week: "Weeks 7-8",
      title: "Clinical Experience & Exam Prep",
      topics: ["16+ hours supervised clinical practice", "Real patient care in healthcare facility", "Skills competency review", "State exam preparation"],
      project: "Pass Indiana CNA competency exam"
    }
  ];

  const stats = [
    { value: "95%", label: "Exam Pass Rate", icon: Award },
    { value: "$32K", label: "Average Starting Salary", icon: DollarSign },
    { value: "8", label: "Weeks to Certified", icon: Calendar },
    { value: "4%+", label: "Annual Job Growth", icon: TrendingUp }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Healthcare', href: '/programs/healthcare' },
            { label: 'Certified Nursing Assistant' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pink-800 via-pink-700 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FundingBadge type="self-pay" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Become a
                <span className="text-pink-300"> Certified Nursing Assistant</span>
              </h1>
              
              <p className="text-xl text-pink-100 mb-8 leading-relaxed">
                Make a difference in patients' lives every day. Learn essential nursing skills and 
                start your healthcare career in just <strong className="text-white">8 weeks.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-pink-300" />6-8 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-brand-green-400" />$1,200 Tuition
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <HeartPulse className="w-4 h-4 text-pink-300" />Pathway to Nursing
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply" className="inline-flex items-center justify-center px-8 py-4 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-pink-500/30">
                  Apply Now<ArrowRight className="w-5 h-5 ml-2" />
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
                <stat.icon className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CNA */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-pink-100 text-pink-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why CNA?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Start Your Nursing Journey</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">CNA is the fastest path into healthcare and the foundation for a nursing career.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Heart, title: "Meaningful Work", description: "Provide hands-on care that directly improves patients' quality of life. Your compassion makes a real difference every day." },
              { icon: Clock, title: "Quick Certification", description: "Get certified in just 6-8 weeks. Start earning and gaining experience while others are still in school." },
              { icon: GraduationCap, title: "Pathway to RN", description: "Many nurses started as CNAs. Gain invaluable patient care experience that nursing schools value." },
              { icon: Building, title: "Work Options", description: "Hospitals, nursing homes, home health, hospice - choose the setting that fits your life and interests." },
              { icon: Shield, title: "Job Security", description: "CNAs are always needed. An aging population ensures steady demand for compassionate caregivers." },
              { icon: UserCheck, title: "Flexible Schedules", description: "Day, evening, night, and weekend shifts available. Find a schedule that works for your life." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-pink-600" />
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">8-Week CNA Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">State-approved training with clinical experience. Graduate ready for the Indiana CNA exam.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-pink-600 rounded-2xl flex items-center justify-center text-white">
                      <span className="text-sm font-bold">{module.week}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{module.title}</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {module.topics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Circle className="w-5 h-5 text-brand-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{topic}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-pink-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-pink-700">Milestone:</span>
                      <span className="text-sm text-pink-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Path */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-pink-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">Career Growth</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Your Path to Nursing</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "CNA", salary: "$28-34K", time: "8 weeks", desc: "Start here" },
              { title: "LPN", salary: "$45-55K", time: "+1 year", desc: "Licensed Practical Nurse" },
              { title: "RN (ADN)", salary: "$60-75K", time: "+2 years", desc: "Associate Degree Nurse" },
              { title: "RN (BSN)", salary: "$70-90K", time: "+4 years", desc: "Bachelor's Degree Nurse" }
            ].map((step, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/10 backdrop-blur rounded-xl p-6 text-center relative">
                {index < 3 && <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-pink-500" />}
                <div className="text-3xl font-bold text-pink-400 mb-2">{index + 1}</div>
                <h3 className="font-bold mb-1">{step.title}</h3>
                <p className="text-pink-300 font-semibold">{step.salary}</p>
                <p className="text-sm text-slate-400">{step.time}</p>
                <p className="text-sm text-slate-300 mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Common Questions</span>
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
      <section className="py-20 bg-gradient-to-br from-pink-600 to-pink-800 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Caring for Others?</h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">Begin your nursing journey with CNA certification. $1,200 tuition with payment plans available.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center px-8 py-4 bg-white text-pink-600 font-semibold rounded-full hover:bg-pink-50 transition-all transform hover:scale-105 shadow-lg">
              Apply Now<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-pink-700 hover:bg-pink-600 text-white font-semibold rounded-full transition-all">
              <Phone className="w-5 h-5 mr-2" />Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
