'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle,
  ChevronRight,
  Video,
  Monitor,
  Globe,
  Shield,
  Clock,
  DollarSign,
  Handshake,
  Wrench,
  Stethoscope,
  Truck,
  Scissors,
  Lightbulb,
  ArrowRight,
  Calendar,
  Home,
  Heart,
  Target,
  TrendingUp,
  FileText,
  UsersRound,
  Download,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

export const metadata = {
  title: 'Workforce Development Demo | Elevate for Humanity',
  description: 'Interactive demo for workforce agencies, VR, WIOA, and funding partners. Learn about our hybrid workforce training model and 3rd party vendor partnerships.',
};

// Demo content for export
const DEMO_CONTENT = {
  title: 'Elevate for Humanity - Workforce Development Platform',
  subtitle: 'Interactive Demo for Funding Partners',
  sections: [
    {
      title: 'The Challenge',
      points: [
        'Fixed facilities require huge capital investment',
        'Equipment costs are prohibitive for most schools',
        'Hands-on training is limited by physical space',
        'Students travel long distances for practical experience',
        "Training can't scale to meet workforce demands",
      ],
    },
    {
      title: 'Our Solution',
      subtitle: 'Hybrid training that scales',
      points: [
        'Online coursework + local hands-on partners',
        'Students learn theory at home, practice locally',
        'No need for expensive lab equipment',
        '3rd party vendors provide hands-on training',
        'Scale to thousands without building facilities',
      ],
    },
    {
      title: 'Career Pathways',
      careers: [
        { name: 'Healthcare', roles: ['Medical Assistant', 'Phlebotomy', 'EKG Tech', 'CNA'], certs: ['NHA', 'BLS/CPR'] },
        { name: 'Trades', roles: ['HVAC Technician', 'Building Tech', 'CDL Driver', 'Welder'], certs: ['EPA 608', 'CDL Class A/B'] },
        { name: 'Beauty', roles: ['Barber', 'Cosmetologist', 'Esthetician', 'Nail Tech'], certs: ['State Board', 'NHA'] },
        { name: 'Business', roles: ['Admin', 'Billing/Coding', 'EHR Specialist', 'Customer Service'], certs: ['RHIT', 'MOS'] },
      ],
    },
    {
      title: 'Partner Network',
      points: [
        'Host shops provide RTI (Related Technical Instruction)',
        'Employers offer OJL (On-the-Job Learning)',
        'Licensed facilities handle clinical rotations',
        'Community partners provide equipment access',
        'We coordinate, track, and certify everything',
      ],
    },
    {
      title: 'Dashboard Features',
      features: [
        'Admin Dashboard - Students, programs, payments, reporting',
        'Student Portal - Track progress, view credentials, book appointments',
        'Employer Portal - Apprentices, OJL hours, competencies',
        'Host Shop Portal - RTI tracking, clock in/out approval',
        'Case Manager View - Outcomes, placement, compliance',
      ],
    },
    {
      title: 'Funding Options',
      sources: [
        { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth' },
        { name: 'WIOA Title III', desc: 'Vocational Rehabilitation' },
        { name: 'TAA', desc: 'Trade Adjustment Assistance' },
        { name: 'Pell Grant', desc: 'Federal student aid' },
        { name: 'VR Services', desc: 'Individualized services' },
        { name: 'Employer', desc: 'Direct sponsorship' },
      ],
    },
    {
      title: 'Compliance & Reporting',
      points: [
        'Automated PIRL reporting',
        'WIOA eligibility tracking',
        'Individual Training Accounts (ITA)',
        'Service provider reporting',
        'Outcome measurement',
      ],
    },
  ],
};

// Video URL - Uses the platform's demo video (elevateOverview)
// The videoCdnUrl in platform-config must be set for videos to work
// Falls back to a placeholder gradient if video not available
const DEMO_VIDEO_KEY = 'elevateOverview';
const DEMO_VIDEO_FALLBACK = '/videos/elevate-overview-with-narration.mp4';

export default function WorkforceFundingDemo() {
  const [activeSection, setActiveSection] = useState(0);
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'wioa' | 'vr' | 'taa' | 'employer'>('all');
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const demoUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.elevateforhumanity.org/store/demos/vr-funding';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(demoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    let content = `${DEMO_CONTENT.title}\n${DEMO_CONTENT.subtitle}\n\n`;
    content += '='.repeat(50) + '\n\n';

    DEMO_CONTENT.sections.forEach((section, i) => {
      content += `${i + 1}. ${section.title}\n`;
      if (section.subtitle) content += `   ${section.subtitle}\n`;
      
      if (section.points) {
        section.points.forEach(point => {
          content += `   • ${point}\n`;
        });
      }
      
      if (section.careers) {
        section.careers.forEach(career => {
          content += `   ${career.name}:\n`;
          career.roles.forEach(role => {
            content += `      - ${role}\n`;
          });
          content += `      Certifications: ${career.certs.join(', ')}\n`;
        });
      }
      
      if (section.features) {
        section.features.forEach(f => {
          content += `   • ${f}\n`;
        });
      }
      
      if (section.sources) {
        section.sources.forEach(s => {
          content += `   • ${s.name}: ${s.desc}\n`;
        });
      }
      
      content += '\n';
    });

    content += '\n' + '='.repeat(50) + '\n';
    content += '\nLive Demo: https://admin.elevateforhumanity.org\n';
    content += 'Contact: support@elevateforhumanity.org\n';
    content += 'Phone: (317) 314-3757\n';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Elevate-Workforce-Demo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareDemo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: DEMO_CONTENT.title,
          text: 'Interactive workforce development platform demo',
          url: demoUrl,
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const audiences = [
    { id: 'all', label: 'All Audiences', color: 'bg-purple-600' },
    { id: 'wioa', label: 'WIOA', color: 'bg-blue-600' },
    { id: 'vr', label: 'Vocational Rehab', color: 'bg-green-600' },
    { id: 'taa', label: 'TAA', color: 'bg-orange-600' },
    { id: 'employer', label: 'Employers', color: 'bg-teal-600' },
  ];

  const sections = [
    {
      id: 'overview',
      title: 'The Challenge',
      subtitle: 'Traditional workforce training is broken',
      icon: Lightbulb,
      color: 'bg-red-600',
      audiences: ['all', 'wioa', 'vr', 'taa'],
      points: [
        'Fixed facilities require huge capital investment',
        'Equipment costs are prohibitive for most schools',
        'Hands-on training is limited by physical space',
        'Students travel long distances for practical experience',
        'Training can\'t scale to meet workforce demands',
      ],
    },
    {
      id: 'solution',
      title: 'Our Solution',
      subtitle: 'Hybrid training that scales',
      icon: Globe,
      color: 'bg-purple-600',
      audiences: ['all', 'wioa', 'vr', 'taa', 'employer'],
      points: [
        'Online coursework + local hands-on partners',
        'Students learn theory at home, practice locally',
        'No need for expensive lab equipment',
        '3rd party vendors provide hands-on training',
        'Scale to thousands without building facilities',
      ],
    },
    {
      id: 'careers',
      title: 'Career Pathways',
      subtitle: 'Industry-recognized credentials',
      icon: Briefcase,
      color: 'bg-green-600',
      audiences: ['all', 'wioa', 'vr', 'taa', 'employer'],
      careers: [
        { name: 'Healthcare', icon: Stethoscope, roles: ['Medical Assistant', 'Phlebotomy', 'EKG Tech', 'CNA'], certs: ['NHA', 'BLS/CPR'] },
        { name: 'Trades', icon: Wrench, roles: ['HVAC Technician', 'Building Tech', 'CDL Driver', 'Welder'], certs: ['EPA 608', 'CDL Class A/B'] },
        { name: 'Beauty', icon: Scissors, roles: ['Barber', 'Cosmetologist', 'Esthetician', 'Nail Tech'], certs: ['State Board', 'NHA'] },
        { name: 'Business', icon: Monitor, roles: ['Admin', 'Billing/Coding', 'EHR Specialist', 'Customer Service'], certs: ['RHIT', 'MOS'] },
      ],
    },
    {
      id: 'partners',
      title: 'Partner Network',
      subtitle: '3rd party vendors power hands-on training',
      icon: Handshake,
      color: 'bg-blue-600',
      audiences: ['all', 'wioa', 'vr', 'taa', 'employer'],
      points: [
        'Host shops provide RTI (Related Technical Instruction)',
        'Employers offer OJL (On-the-Job Learning)',
        'Licensed facilities handle clinical rotations',
        'Community partners provide equipment access',
        'We coordinate, track, and certify everything',
      ],
    },
    {
      id: 'dashboard',
      title: 'The Dashboard',
      subtitle: 'Real-time tracking for all stakeholders',
      icon: Monitor,
      color: 'bg-orange-600',
      audiences: ['all', 'wioa', 'vr', 'taa', 'employer'],
      features: [
        { title: 'Admin Dashboard', desc: 'Students, programs, payments, reporting' },
        { title: 'Student Portal', desc: 'Track progress, view credentials, book appointments' },
        { title: 'Employer Portal', desc: 'Apprentices, OJL hours, competencies' },
        { title: 'Host Shop Portal', desc: 'RTI tracking, clock in/out approval' },
        { title: 'Case Manager View', desc: 'Outcomes, placement, compliance' },
      ],
    },
    {
      id: 'funding',
      title: 'Funding Options',
      subtitle: 'Multiple pathways to enrollment',
      icon: DollarSign,
      color: 'bg-teal-600',
      audiences: ['all', 'wioa', 'vr', 'taa'],
      fundingSources: [
        { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth', icon: Users },
        { name: 'WIOA Title III', desc: 'Vocational Rehabilitation', icon: Heart },
        { name: 'TAA', desc: 'Trade Adjustment Assistance', icon: TrendingUp },
        { name: 'Pell Grant', desc: 'Federal student aid', icon: FileText },
        { name: 'VR Services', desc: 'Individualized services', icon: Target },
        { name: 'Employer', desc: 'Direct sponsorship', icon: Building2 },
      ],
    },
    {
      id: 'compliance',
      title: 'Compliance & Reporting',
      subtitle: 'Built-in reporting for workforce boards',
      icon: Shield,
      color: 'bg-indigo-600',
      audiences: ['all', 'wioa'],
      points: [
        'Automated PIRL reporting',
        'WIOA eligibility tracking',
        'Individual Training Accounts (ITA)',
        'Service provider reporting',
        'Outcome measurement',
      ],
    },
  ];

  // Filter sections by selected audience
  const filteredSections = sections.filter(
    section => selectedAudience === 'all' || section.audiences?.includes(selectedAudience)
  );

  // Reset active section if it goes out of bounds
  const safeActiveSection = Math.min(activeSection, filteredSections.length - 1);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Navigation */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Elevate for Humanity</h1>
              <p className="text-xs text-slate-400">Workforce Development Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadAsText}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Download Demo Summary"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={shareDemo}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Share Demo Link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <Link
              href="/store/demos"
              className="text-sm text-slate-400 hover:text-white transition-colors px-2"
            >
              All Demos
            </Link>
            <a
              href="https://admin.elevateforhumanity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-red-600 hover:bg-brand-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Live Demo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Audience Selector */}
      <section className="bg-slate-800/50 border-b border-slate-700 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-400">Filter for:</span>
            <div className="flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <button
                  key={audience.id}
                  onClick={() => {
                    setSelectedAudience(audience.id as typeof selectedAudience);
                    setActiveSection(0);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedAudience === audience.id
                      ? `${audience.color} text-white`
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {audience.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
            <Video className="w-4 h-4" />
            <span>Interactive Demo • {filteredSections.length} Sections</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Workforce Development
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Platform Demo
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-6 max-w-3xl mx-auto">
            How Elevate prepares participants for careers in healthcare, trades, and business — 
            <strong className="text-white"> without requiring massive facilities</strong>, 
            by partnering with existing 3rd party vendors for hands-on training.
          </p>
          <p className="text-slate-400 mb-8">
            Works with WIOA • Vocational Rehabilitation • TAA • Pell Grants • Employer Sponsorships
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveSection(0)}
              className="bg-brand-red-600 hover:bg-brand-red-700 px-6 py-3 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Demo
            </button>
            <a
              href="https://admin.elevateforhumanity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-lg font-semibold transition-all flex items-center gap-2"
            >
              <Monitor className="w-5 h-5" />
              Live Demo
            </a>
          </div>
        </div>
      </section>

      {/* Section Navigation */}
      <section className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto py-4 gap-2">
            {filteredSections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(index)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  safeActiveSection === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {filteredSections.map((section, index) => (
            <div
              key={section.id}
              className={`transition-all duration-500 ${
                safeActiveSection === index ? 'block' : 'hidden'
              }`}
            >
              <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                {/* Section Header */}
                <div className={`${section.color} p-8`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      <section.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold">{section.title}</h2>
                      <p className="text-white/80">{section.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-8">
                  {section.id === 'overview' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-200">
                          The Problem with Traditional Training
                        </h3>
                        <ul className="space-y-4">
                          {section.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-red-400 text-sm">✗</span>
                              </div>
                              <span className="text-slate-300">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-700/50 rounded-xl p-6">
                        <h4 className="font-bold text-lg mb-4 text-purple-300">
                          💡 Our Innovation
                        </h4>
                        <p className="text-slate-300 mb-4">
                          We flip the model: theory online, practice locally.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-slate-800 rounded-lg p-4">
                            <div className="text-3xl font-bold text-purple-400">85%</div>
                            <div className="text-sm text-slate-400">Online Learning</div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-4">
                            <div className="text-3xl font-bold text-green-400">15%</div>
                            <div className="text-sm text-slate-400">Hands-On</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'solution' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-200">
                          How Our Hybrid Model Works
                        </h3>
                        {section.points.map((point, i) => (
                          <div key={i} className="flex items-start gap-4 bg-slate-700/30 p-4 rounded-lg">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-slate-300">{point}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
                        <h4 className="font-bold text-lg mb-4 text-purple-300">
                          🏭 No Facilities Needed
                        </h4>
                        <div className="space-y-4">
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="font-semibold text-white mb-1">Traditional School</div>
                            <div className="text-red-400">❌ $5M+ building</div>
                            <div className="text-red-400">❌ $500K equipment</div>
                            <div className="text-red-400">❌ Limited capacity</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="font-semibold text-white mb-1">Elevate Model</div>
                            <div className="text-green-400">✓ Cloud platform</div>
                            <div className="text-green-400">✓ Partner facilities</div>
                            <div className="text-green-400">✓ Unlimited scaling</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'careers' && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        Participants can pursue careers in high-demand industries with 
                        <strong className="text-white"> industry-recognized credentials</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {section.careers?.map((career, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 hover:border-purple-500 transition-colors">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                              <career.icon className="w-6 h-6 text-purple-400" />
                            </div>
                            <h4 className="font-bold text-lg mb-3">{career.name}</h4>
                            <ul className="space-y-2 mb-4">
                              {career.roles.map((role, j) => (
                                <li key={j} className="text-slate-400 text-sm flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                                  {role}
                                </li>
                              ))}
                            </ul>
                            <div className="flex flex-wrap gap-1">
                              {career.certs.map((cert, k) => (
                                <span key={k} className="text-xs bg-green-600/30 text-green-400 px-2 py-1 rounded">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 bg-green-900/30 border border-green-600/30 rounded-xl p-6">
                        <h4 className="font-bold text-green-400 mb-2">✓ Certification Ready</h4>
                        <p className="text-slate-300">
                          Our programs prepare students for NHA, EPA 608, state board exams, 
                          and other industry-recognized certifications.
                        </p>
                      </div>
                    </div>
                  )}

                  {section.id === 'partners' && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-200">
                          Our 3rd Party Partner Network
                        </h3>
                        <ul className="space-y-4">
                          {section.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-4">
                              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Handshake className="w-5 h-5 text-blue-400" />
                              </div>
                              <span className="text-slate-300">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-slate-700/50 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Scissors className="w-5 h-5 text-orange-400" />
                            Host Shops (Beauty)
                          </h4>
                          <p className="text-slate-400 text-sm">
                            Barbershops and salons provide hands-on training for barber, 
                            cosmetology, and esthetics programs.
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-400" />
                            Employers (Trades)
                          </h4>
                          <p className="text-slate-400 text-sm">
                            HVAC companies, fleet services, and building maintenance firms 
                            provide OJL for technical programs.
                          </p>
                        </div>
                        <div className="bg-slate-700/50 rounded-xl p-6">
                          <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-green-400" />
                            Clinical Partners (Healthcare)
                          </h4>
                          <p className="text-slate-400 text-sm">
                            Medical facilities and labs provide clinical rotations for 
                            healthcare certification programs.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'dashboard' && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        A unified dashboard tracks everything — 
                        <strong className="text-white"> from enrollment to employment</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.features?.map((feature, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 hover:border-orange-500 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <Monitor className="w-5 h-5 text-orange-400" />
                              </div>
                              <span className="font-semibold">{feature.title}</span>
                            </div>
                            <p className="text-slate-400 text-sm">{feature.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 bg-purple-900/30 border border-purple-600/30 rounded-xl p-6">
                        <h4 className="font-bold text-purple-400 mb-2">📊 Outcome Tracking</h4>
                        <p className="text-slate-300 mb-4">
                          Track placement rates, credential attainment, wage gains, and employment retention.
                        </p>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div className="bg-slate-800 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-400">85%</div>
                            <div className="text-xs text-slate-400">Placement Rate</div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-400">92%</div>
                            <div className="text-xs text-slate-400">Credential Rate</div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-400">6 mo</div>
                            <div className="text-xs text-slate-400">Avg. Placement</div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-400">$18+</div>
                            <div className="text-xs text-slate-400">Avg. Starting</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'funding' && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        Multiple funding pathways make our programs 
                        <strong className="text-white"> accessible to participants</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.fundingSources?.map((source, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 hover:border-teal-500 transition-colors">
                            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                              <source.icon className="w-5 h-5 text-teal-400" />
                            </div>
                            <h4 className="font-semibold mb-1">{source.name}</h4>
                            <p className="text-slate-400 text-sm">{source.desc}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-8 bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-8 border border-purple-500/30">
                        <h4 className="font-bold text-xl mb-4 text-center">
                          💰 Why Funding Partners Choose Us
                        </h4>
                        <div className="grid md:grid-cols-3 gap-6 text-center">
                          <div>
                            <div className="text-3xl font-bold text-green-400 mb-2">Free</div>
                            <p className="text-slate-300 text-sm">For eligible participants</p>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-purple-400 mb-2">Fast</div>
                            <p className="text-slate-300 text-sm">Enroll in days, not months</p>
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-blue-400 mb-2">Flexible</div>
                            <p className="text-slate-300 text-sm">Online + local partners</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-8 pt-8 border-t border-slate-700 flex justify-between">
                    {index > 0 && (
                      <button
                        onClick={() => setActiveSection(index - 1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                        Previous
                      </button>
                    )}
                    <div className="flex-1" />
                    {index < filteredSections.length - 1 && (
                      <button
                        onClick={() => setActiveSection(index + 1)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Next: {filteredSections[index + 1].title}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Watch the Demo Video</h2>
            <p className="text-slate-400">A 5-minute overview of how Elevate works for workforce partners</p>
          </div>
          
          {/* Video Container */}
          <div className="bg-slate-700 rounded-2xl overflow-hidden border border-slate-600">
            {showVideo ? (
              <div className="aspect-video bg-black">
                <video
                  key={DEMO_VIDEO_FALLBACK}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  poster="/images/pages/wioa-meeting.webp"
                >
                  <source src={DEMO_VIDEO_FALLBACK} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div 
                className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center relative cursor-pointer group"
                onClick={() => setShowVideo(true)}
              >
                <div className="text-center">
                  <div className="w-24 h-24 bg-brand-red-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-red-700 transition-colors group-hover:scale-110 transform">
                    <Play className="w-12 h-12 text-white ml-2" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Click to Play Video</h3>
                  <p className="text-slate-400">Duration: ~5 minutes</p>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 left-4 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-sm">
                  HD
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-sm">
                  English
                </div>
              </div>
            )}
            {showVideo && (
              <div className="p-4 bg-slate-700 border-t border-slate-600 flex justify-between items-center">
                <span className="text-sm text-slate-400">Now playing: Elevate for Humanity Overview</span>
                <button
                  onClick={() => setShowVideo(false)}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Close Video
                </button>
              </div>
            )}
          </div>
          
          {/* Video Chapters */}
          <div className="mt-6 bg-slate-700/50 rounded-xl p-6 border border-slate-600">
            <h4 className="font-bold text-lg mb-4">Video Chapters</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-slate-300">The Challenge (0:00)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-slate-300">Our Solution (1:00)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-slate-300">Career Pathways (2:00)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <span className="text-slate-300">Partner Network (3:00)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">5</div>
                <span className="text-slate-300">Dashboard (4:00)</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">6</div>
                <span className="text-slate-300">Get Started (4:30)</span>
              </div>
            </div>
          </div>
          
          {/* Video Status */}
          <div className="mt-6 bg-blue-900/30 border border-blue-600/30 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              📹 Video path: <code className="bg-slate-800 px-2 py-1 rounded">{DEMO_VIDEO_FALLBACK}</code>
              <br />
              <span className="text-slate-400">Set <code className="bg-slate-800 px-2 py-1 rounded">NEXT_PUBLIC_VIDEO_CDN_URL</code> to use CDN-hosted video.</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to See It In Action?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Try our live demo or schedule a personalized walkthrough for your team.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <a
              href="https://admin.elevateforhumanity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-red-600 hover:bg-brand-red-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Monitor className="w-5 h-5" />
              Try Live Demo
            </a>
            <Link
              href="/contact"
              className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </Link>
          </div>
          
          {/* Download Options */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-sm text-slate-300 mb-4">Download Demo Materials:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={downloadAsText}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Summary (.txt)
              </button>
              <button
                onClick={shareDemo}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Share Link'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>Elevate for Humanity • Workforce Development Platform</p>
          <p className="text-sm mt-2">
            Contact: support@elevateforhumanity.org • (317) 314-3757
          </p>
        </div>
      </footer>
    </div>
  );
}
