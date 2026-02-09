'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import { 
  Clock, DollarSign, TrendingUp, CheckCircle, ArrowRight, 
  Shield, Award, Users, Calendar, ChevronDown, ChevronUp, 
  Play, Phone, GraduationCap, Briefcase, Lock, Server,
  Eye, AlertTriangle, Network, FileKey
} from 'lucide-react';

export default function CybersecurityProgramPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Do I need a technical background to start?",
      answer: "Basic computer skills are helpful, but you don't need programming experience. We start with fundamentals - networking basics, operating systems, and security concepts. Many successful cybersecurity professionals came from non-technical backgrounds."
    },
    {
      question: "What certifications will I earn?",
      answer: "You'll be prepared for CompTIA Security+ certification, the industry-standard entry-level security credential. We also cover material for Network+ and prepare you for specialized certs like CySA+ and PenTest+ as you advance."
    },
    {
      question: "How long is the program?",
      answer: "The program is 16-20 weeks depending on your schedule. This includes classroom instruction, hands-on labs, and certification preparation. We offer day and evening options to fit your schedule."
    },
    {
      question: "What jobs can I get after completing the program?",
      answer: "Entry-level positions include Security Analyst, SOC Analyst, IT Security Specialist, and Security Administrator. With experience, you can advance to Penetration Tester, Security Engineer, or Security Architect roles."
    },
    {
      question: "Is cybersecurity really in demand?",
      answer: "Absolutely. There are over 750,000 unfilled cybersecurity positions in the US alone. The Bureau of Labor Statistics projects 32% job growth through 2032 - much faster than average. Every organization needs security professionals."
    },
    {
      question: "What's the salary potential?",
      answer: "Entry-level Security Analysts in Indiana start at $55,000-$70,000. With 3-5 years experience, salaries reach $80,000-$100,000. Senior roles and specialists can earn $120,000-$150,000+. Remote work options are common."
    },
    {
      question: "Will I learn hands-on skills or just theory?",
      answer: "Both. You'll work in our cyber lab with real tools - Wireshark, Nmap, Metasploit, SIEM platforms, and more. You'll practice identifying vulnerabilities, analyzing threats, and responding to simulated incidents."
    },
    {
      question: "Can I work remotely in cybersecurity?",
      answer: "Yes! Cybersecurity is one of the most remote-friendly fields. Many SOC analyst and security engineer positions are fully remote. This gives you flexibility and access to jobs nationwide, not just locally."
    }
  ];

  const curriculum = [
    {
      week: "Weeks 1-2",
      title: "IT & Networking Fundamentals",
      topics: ["Computer hardware and operating systems", "TCP/IP networking and protocols", "Network devices and architecture", "Linux command line basics"],
      project: "Set up and configure a network lab environment"
    },
    {
      week: "Weeks 3-4",
      title: "Security Fundamentals",
      topics: ["CIA triad and security principles", "Threat landscape and attack types", "Security frameworks (NIST, ISO 27001)", "Risk assessment and management"],
      project: "Conduct a basic risk assessment"
    },
    {
      week: "Weeks 5-6",
      title: "Network Security",
      topics: ["Firewalls and access control lists", "VPNs and secure remote access", "Intrusion detection/prevention systems", "Network segmentation and DMZ"],
      project: "Configure firewall rules and IDS alerts"
    },
    {
      week: "Weeks 7-8",
      title: "Identity & Access Management",
      topics: ["Authentication methods and MFA", "Active Directory security", "Privileged access management", "Single sign-on and federation"],
      project: "Implement secure authentication system"
    },
    {
      week: "Weeks 9-10",
      title: "Threat Detection & Analysis",
      topics: ["SIEM platforms and log analysis", "Threat intelligence fundamentals", "Malware analysis basics", "Indicators of compromise (IOCs)"],
      project: "Analyze security logs and identify threats"
    },
    {
      week: "Weeks 11-12",
      title: "Vulnerability Management",
      topics: ["Vulnerability scanning tools", "Penetration testing concepts", "Remediation prioritization", "Patch management strategies"],
      project: "Conduct vulnerability scan and report findings"
    },
    {
      week: "Weeks 13-14",
      title: "Incident Response",
      topics: ["Incident response procedures", "Digital forensics basics", "Evidence collection and chain of custody", "Incident documentation and reporting"],
      project: "Respond to simulated security incident"
    },
    {
      week: "Weeks 15-16",
      title: "Certification & Career Prep",
      topics: ["CompTIA Security+ exam preparation", "Resume and LinkedIn optimization", "Interview preparation", "Industry networking"],
      project: "Pass Security+ practice exams and secure employment"
    }
  ];

  const stats = [
    { value: "32%", label: "Job Growth Rate", icon: TrendingUp },
    { value: "$65K", label: "Average Starting Salary", icon: DollarSign },
    { value: "750K+", label: "Unfilled US Jobs", icon: Briefcase },
    { value: "16", label: "Weeks to Career", icon: Calendar }
  ];

  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Technology', href: '/programs/technology' },
            { label: 'Cybersecurity' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-emerald-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <FundingBadge type="funded" />
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mt-6 mb-6 leading-tight">
                Launch Your
                <span className="text-emerald-400"> Cybersecurity Career</span>
              </h1>
              
              <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
                Protect organizations from cyber threats. Learn threat detection, incident response, and security operations. 
                Join one of the <strong className="text-white">fastest-growing fields in tech.</strong>
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <Clock className="w-4 h-4 text-emerald-400" />16-20 Weeks
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <DollarSign className="w-4 h-4 text-green-400" />$0 with WIOA Funding
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />$65K+ Starting Salary
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/wioa-eligibility" className="inline-flex items-center justify-center px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30">
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
                <stat.icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Cybersecurity */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">Why Cybersecurity?</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Defend the Digital World</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Cyber attacks cost businesses billions annually. Organizations desperately need skilled defenders.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: AlertTriangle, title: "Critical Shortage", description: "Over 750,000 cybersecurity positions are unfilled in the US. Demand far exceeds supply, creating exceptional job security." },
              { icon: DollarSign, title: "Premium Salaries", description: "Security professionals command top salaries. Entry-level starts at $55-70K, with senior roles exceeding $150K." },
              { icon: Network, title: "Remote-Friendly", description: "Many security roles are fully remote. Work from anywhere while protecting organizations worldwide." },
              { icon: Shield, title: "Meaningful Work", description: "Protect people's data, privacy, and livelihoods. Stop criminals and nation-state actors from causing harm." },
              { icon: TrendingUp, title: "Constant Growth", description: "32% projected job growth through 2032. As technology expands, so does the need for security." },
              { icon: Lock, title: "Diverse Paths", description: "Specialize in penetration testing, incident response, cloud security, compliance, or management. Many paths to choose from." }
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-emerald-600" />
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">16-Week Cybersecurity Curriculum</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Hands-on training with real security tools. Graduate ready for Security+ certification.</p>
          </div>

          <div className="space-y-6">
            {curriculum.map((module, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-slate-50 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
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
                    <div className="bg-emerald-50 rounded-lg p-4 mt-4">
                      <span className="text-sm font-semibold text-emerald-700">Lab Project:</span>
                      <span className="text-sm text-emerald-600 ml-2">{module.project}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-emerald-300 text-sm font-semibold px-4 py-1 rounded-full mb-4">Industry Credentials</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Certification Preparation</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "CompTIA Security+", description: "The industry-standard entry-level security certification. Required or preferred for most security analyst positions.", icon: Shield },
              { title: "CompTIA Network+", description: "Foundational networking knowledge that supports your security skills. Validates your understanding of network infrastructure.", icon: Network },
              { title: "CompTIA CySA+", description: "Advanced certification for threat detection and response. A natural next step after Security+ for SOC analysts.", icon: Eye }
            ].map((cert, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{cert.title}</h3>
                <p className="text-slate-300">{cert.description}</p>
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
      <section className="py-20 bg-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Defend the Digital World?</h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">Join the fight against cyber threats. Check your eligibility for free WIOA-funded training.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wioa-eligibility" className="inline-flex items-center justify-center px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-lg">
              Check Eligibility Now<ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-full transition-all">
              <Phone className="w-5 h-5 mr-2" />Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
