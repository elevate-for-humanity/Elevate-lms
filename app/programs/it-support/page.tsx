'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, ArrowRight, 
  Monitor, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Headphones, Server,
  Wifi, HardDrive, Settings, LifeBuoy
} from 'lucide-react';

export default function ITSupportProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need technical experience to start?",
      answer: "No prior IT experience is required. If you can use a computer for basic tasks, you can learn IT support. We start with fundamentals and build your skills progressively. Many successful IT professionals started with no technical background."
    },
    {
      question: "What certifications will I earn?",
      answer: "You'll be prepared for CompTIA A+ certification, the industry-standard credential for IT support professionals. A+ is often required for help desk and desktop support positions. We also introduce Network+ concepts for career advancement."
    },
    {
      question: "How long is the program?",
      answer: "The program is 12-16 weeks. This includes classroom instruction, hands-on labs, and certification preparation. We offer flexible scheduling with day and evening options."
    },
    {
      question: "What kind of jobs can I get?",
      answer: "Graduates work as Help Desk Technicians, Desktop Support Specialists, IT Support Specialists, Field Service Technicians, and Technical Support Representatives. These roles exist in every industry - healthcare, finance, education, government, and more."
    },
    {
      question: "What's the salary potential?",
      answer: "Entry-level IT support in Indiana starts at $38,000-$48,000. With A+ certification and 1-2 years experience, salaries reach $50,000-$60,000. Specializing in areas like networking or security can push earnings to $70,000+."
    },
    {
      question: "Is IT support a good career path?",
      answer: "IT support is an excellent entry point to the technology field. Many IT managers, system administrators, and network engineers started in help desk roles. It's a proven path to higher-paying technical positions."
    },
    {
      question: "Will I learn hands-on skills?",
      answer: "Absolutely. You'll build and troubleshoot computers, configure networks, install operating systems, and solve real-world problems in our lab. We emphasize practical skills employers actually need."
    },
    {
      question: "Can I work remotely in IT support?",
      answer: "Many IT support roles offer remote work options, especially help desk positions. Remote support tools allow technicians to assist users from anywhere. Hybrid arrangements are increasingly common."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "Computer Hardware",
      topics: ["PC components and architecture", "Building and upgrading computers", "Troubleshooting hardware issues", "Laptop and mobile device repair"],
      project: "Build a PC from components and troubleshoot faults"
    },
    {
      week: "Weeks 3-4",
      title: "Operating Systems",
      topics: ["Windows installation and configuration", "macOS and Linux basics", "User account management", "File systems and permissions"],
      project: "Install and configure Windows in enterprise environment"
    },
    {
      week: "Weeks 5-6",
      title: "Networking Fundamentals",
      topics: ["TCP/IP and network protocols", "Routers, switches, and access points", "IP addressing and subnetting", "Wireless network configuration"],
      project: "Set up and troubleshoot a small office network"
    },
    {
      week: "Weeks 7-8",
      title: "Security Fundamentals",
      topics: ["Malware types and removal", "Antivirus and endpoint protection", "User security best practices", "Physical security and social engineering"],
      project: "Identify and remove malware from infected system"
    },
    {
      week: "Weeks 9-10",
      title: "Help Desk Operations",
      topics: ["Ticketing systems and workflows", "Remote support tools", "Customer service skills", "Documentation and knowledge bases"],
      project: "Handle simulated support tickets end-to-end"
    },
    {
      week: "Weeks 11-12",
      title: "Cloud & Mobile",
      topics: ["Microsoft 365 administration", "Google Workspace basics", "Mobile device management", "Cloud storage and sync"],
      project: "Configure Microsoft 365 for small business"
    },
    {
      week: "Weeks 13-14",
      title: "Troubleshooting Methodology",
      topics: ["Systematic troubleshooting approach", "Common problems and solutions", "Escalation procedures", "Root cause analysis"],
      project: "Diagnose and resolve complex technical issues"
    },
    {
      week: "Weeks 15-16",
      title: "Certification & Career Prep",
      topics: ["CompTIA A+ exam preparation", "Resume and interview skills", "IT career paths", "Job placement assistance"],
      project: "Pass A+ practice exams and secure employment"
    }
  ];

  const stats = [
    { value: "88%", label: "Job Placement Rate", icon: Briefcase },
    { value: "$45K", label: "Average Starting Salary", icon: DollarSign },
    { value: "16", label: "Weeks to Career", icon: Calendar },
    { value: "5%", label: "Annual Job Growth", icon: TrendingUp }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Technology', href: '/programs/technology' },
            { label: 'IT Support Specialist' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Become an
                <span className="text-indigo-400"> IT Support Specialist</span>
              </h1>
              
              <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                Start your technology career helping people solve computer problems. 
                Learn hardware, software, networking, and customer service skills for a <strong className="text-white">rewarding entry-level IT role.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-indigo-400" />12-16 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />$0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />$45K+ Starting Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply?program=it-support" className="inline-flex items-center justify-center px-8 py-4 bg-white0 hover:bg-indigo-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30">
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
                <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why IT Support */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why IT Support?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Your Gateway to Tech</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">IT support is the foundation of every technology career. Start here and grow into any IT specialty.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: LifeBuoy, title: "Every Company Needs IT", description: "From small businesses to Fortune 500 companies, every organization needs IT support. Job opportunities exist in every industry." },
              { icon: TrendingUp, title: "Career Advancement", description: "IT support is a launching pad. Many system administrators, network engineers, and IT managers started at the help desk." },
              { icon: Headphones, title: "Help People Daily", description: "Solve problems and make people's work lives easier. IT support is rewarding when you help someone get back to productivity." },
              { icon: DollarSign, title: "Competitive Pay", description: "Entry-level IT support pays $38-48K. With certifications and experience, quickly advance to $50-70K+ roles." },
              { icon: Monitor, title: "Hands-On Work", description: "Work with hardware, software, and networks. Every day brings different challenges and learning opportunities." },
              { icon: Wifi, title: "Remote Options", description: "Many help desk roles offer remote work. Support users from home using remote desktop and ticketing tools." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-indigo-600" />
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">16-Week IT Support Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Hands-on training covering hardware, software, networking, and customer service. Graduate A+ ready.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
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
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-indigo-700">Lab Project:</span>
                      <span className="text-sm text-indigo-600 ml-2">{module.project}</span>
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
      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Start Your IT Career?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">Launch your technology career with IT support training. Check your eligibility for free WIOA funding.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply?program=it-support" className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-lg">
              Register at Indiana Career Connect<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/inquiry?program=it-support" className="inline-flex items-center justify-center px-8 py-4 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-full transition-all">
              <Phone className="w-5 h-5 mr-2" />Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
