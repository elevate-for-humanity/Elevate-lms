import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, Users, Settings, Rocket, CheckCircle, Clock,
  FileText, Video, MessageCircle, Phone, Mail, ArrowRight,
  Target, Award, BarChart3, GraduationCap, HeartHandshake
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Implementation & Onboarding',
  keywords: ["implementation", "onboarding", "setup", "training", "support", "launch"],
  description: 'What happens after you purchase? Our implementation plan gets you up and running in weeks, not months.',
};

const timeline = [
  {
    phase: 'Day 1',
    title: 'Account Setup',
    duration: 'Day 1',
    description: 'Your dedicated implementation manager creates your account and configures your organization settings.',
    tasks: [
      'Account creation and verification',
      'Organization profile setup',
      'Admin user account creation',
      'Initial configuration review',
      'Kickoff call with your team'
    ],
    deliverables: [
      'Production environment access',
      'Admin credentials',
      'Implementation playbook',
      'Kickoff meeting notes'
    ]
  },
  {
    phase: 'Week 1',
    title: 'Configuration',
    duration: 'Days 2-7',
    description: 'We configure the platform to match your programs, workflows, and branding requirements.',
    tasks: [
      'Custom branding application',
      'Program structure setup',
      'User role configuration',
      'Integration setup (if applicable)',
      'Data migration planning'
    ],
    deliverables: [
      'Branded platform environment',
      'Configured programs/courses',
      'User permission structure',
      'Integration documentation'
    ]
  },
  {
    phase: 'Week 2',
    title: 'Staff Onboarding',
    duration: 'Days 8-14',
    description: 'Your staff learns the platform through guided training sessions and hands-on exercises.',
    tasks: [
      'Admin training session',
      'Staff training sessions',
      'Workflow configuration',
      'Test data entry',
      'Support escalation training'
    ],
    deliverables: [
      'Trained administrators',
      'Trained staff members',
      'Configured workflows',
      'Test environment validated'
    ]
  },
  {
    phase: 'Week 3',
    title: 'Launch Preparation',
    duration: 'Days 15-21',
    description: 'Final testing, data migration, and preparation for your go-live date.',
    tasks: [
      'User acceptance testing',
      'Data migration execution',
      'Student import (if applicable)',
      'Communication template setup',
      'Launch checklist completion'
    ],
    deliverables: [
      'UAT sign-off',
      'Migrated data verified',
      'Student accounts created',
      'Go/No-Go decision'
    ]
  },
  {
    phase: 'Week 4',
    title: 'Launch',
    duration: 'Day 22+',
    description: 'Go-live with dedicated support from our team to ensure a smooth transition.',
    tasks: [
      'Go-live execution',
      'Real-time monitoring',
      'Issue resolution',
      'Student enrollment opening',
      'Initial support triage'
    ],
    deliverables: [
      'Live production environment',
      'Active student enrollment',
      'Support access confirmed',
      'Launch success metrics'
    ]
  }
];

const inclusions = [
  {
    category: 'Training',
    icon: GraduationCap,
    items: [
      'Unlimited admin training sessions',
      'Staff training (up to 20 users)',
      'Training video library access',
      'Step-by-step documentation',
      'Best practices guides'
    ]
  },
  {
    category: 'Support',
    icon: HeartHandshake,
    items: [
      'Dedicated implementation manager',
      'Priority support during launch',
      'Weekly check-in calls',
      'Email support',
      'Chat support'
    ]
  },
  {
    category: 'Technical',
    icon: Settings,
    items: [
      'Custom branding setup',
      'Data migration assistance',
      'API integration support',
      'Single Sign-On setup',
      'Custom workflow configuration'
    ]
  },
  {
    category: 'Resources',
    icon: FileText,
    items: [
      'Implementation playbook',
      'Admin user manual',
      'Quick start guides',
      'Video tutorials',
      'FAQ documentation'
    ]
  }
];

export default function ImplementationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image src="/images/alina-smith.jpg" alt="Implementation planning - Elevate for Humanity workforce platform" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              "What happens after we pay?"
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Implementation & Onboarding
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              You asked "What happens after we pay?" — here's the answer. 
              Our proven implementation process gets you live in 4 weeks with full training and support included.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                Start Implementation <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link href="/demos" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
                See Platform Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Overview */}
      <section className="py-16 bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Your Journey to Launch
            </h2>
            <p className="text-xl text-slate-600">
              From purchase to production in 4 weeks
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-brand-blue-200 -translate-y-1/2" />
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
              {timeline.map((item, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 h-full">
                    <div className="w-12 h-12 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4 -mt-10 relative z-10 border-4 border-white">
                      {index + 1}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-brand-blue-600 font-medium uppercase tracking-wide mb-1">{item.phase}</p>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Phase-by-Phase Breakdown
            </h2>
          </div>

          <div className="space-y-8">
            {timeline.map((phase, index) => (
              <div key={index} className="relative">
                {/* Timeline connector */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-brand-blue-200 hidden md:block" />
                )}
                
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                  <div className="bg-brand-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm font-medium">{phase.phase}</p>
                        <h3 className="text-2xl font-bold">{phase.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-200 text-sm">Duration</p>
                        <p className="font-bold">{phase.duration}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-slate-600 mb-6">{phase.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Key Tasks
                        </h4>
                        <ul className="space-y-2">
                          {phase.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <div className="w-5 h-5 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-brand-blue-600 text-xs">{i + 1}</span>
                              </div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-brand-blue-600" />
                          Deliverables
                        </h4>
                        <ul className="space-y-2">
                          {phase.deliverables.map((deliverable, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What's Included
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every implementation includes comprehensive training, support, and resources.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inclusions.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-14 h-14 bg-brand-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <category.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">{category.category}</h3>
                <ul className="space-y-3">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-600 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Support Process
              </h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                From your first login to ongoing operations, our support team is here to help 
                you succeed. Here's how you can reach us.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Live Chat</h4>
                    <p className="text-slate-600 text-sm mb-2">
                      Get instant answers to common questions during business hours.
                    </p>
                    <p className="text-xs text-slate-500">Available 8am-6pm EST, Mon-Fri</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Email Support</h4>
                    <p className="text-slate-600 text-sm mb-2">
                      Submit tickets anytime. We respond within 24 hours.
                    </p>
                    <p className="text-xs text-slate-500">help@elevateforhumanity.org</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Video className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Video Training</h4>
                    <p className="text-slate-600 text-sm mb-2">
                      Self-paced training videos covering every feature.
                    </p>
                    <p className="text-xs text-slate-500">Available 24/7 in the Help Center</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Phone Support</h4>
                    <p className="text-slate-600 text-sm mb-2">
                      Enterprise customers get priority phone access.
                    </p>
                    <p className="text-xs text-slate-500">Available for Enterprise plans</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Your Implementation Team</h3>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Implementation Manager</h4>
                    <p className="text-slate-600 text-sm">
                      Your dedicated point of contact throughout setup
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Technical Specialist</h4>
                    <p className="text-slate-600 text-sm">
                      Expert help for integrations and configuration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Training Specialist</h4>
                    <p className="text-slate-600 text-sm">
                      Guides your team through the learning process
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-14 h-14 bg-brand-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-brand-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Success Manager</h4>
                    <p className="text-slate-600 text-sm">
                      Ongoing support after launch for continuous improvement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Included */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Training Included
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              We don't just hand you a platform — we make sure your team knows how to use it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-bold mb-2">Video Library</h3>
              <p className="text-blue-100 text-sm mb-4">
                50+ training videos covering every feature, from basics to advanced.
              </p>
              <p className="text-xs text-blue-200">Available 24/7</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">Live Sessions</h3>
              <p className="text-blue-100 text-sm mb-4">
                Weekly group training sessions for common features and best practices.
              </p>
              <p className="text-xs text-blue-200">Every Wednesday</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">Documentation</h3>
              <p className="text-blue-100 text-sm mb-4">
                Comprehensive guides, checklists, and reference materials.
              </p>
              <p className="text-xs text-blue-200">Always up-to-date</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Schedule a call with our implementation team to discuss your timeline and requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Schedule Implementation Call <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/demos" className="inline-flex items-center border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-bold py-4 px-8 rounded-lg transition-colors">
              View Demo First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}