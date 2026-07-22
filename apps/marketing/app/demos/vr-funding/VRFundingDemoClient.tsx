'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Building2, Briefcase, GraduationCap, CheckCircle, ChevronRight, Video, Monitor, Globe, DollarSign, Handshake, Wrench, Stethoscope, Scissors, Lightbulb, ArrowRight, Calendar, Download, Share2, FileText } from 'lucide-react';

type Audience = 'all' | 'wioa' | 'vr' | 'taa' | 'employer';

const sections = [
  {
    id: 'overview',
    title: 'The Challenge',
    subtitle: 'Traditional workforce training is broken',
    icon: Lightbulb,
    color: 'bg-red-600',
    audiences: ['all', 'wioa', 'vr', 'taa', 'employer'] as Audience[],
    points: [
      'Fixed facilities require huge capital investment ($5M+)',
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
    audiences: ['all', 'wioa', 'vr', 'taa', 'employer'] as Audience[],
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
    audiences: ['all', 'wioa', 'vr', 'taa'] as Audience[],
    careers: [
      { name: 'Healthcare', icon: Stethoscope, roles: ['Medical Assistant', 'Phlebotomy', 'EKG Tech', 'CNA'], certs: ['NHA', 'BLS/CPR', 'State Board'] },
      { name: 'Trades', icon: Wrench, roles: ['HVAC Technician', 'Building Tech', 'CDL Driver', 'Welder'], certs: ['EPA 608', 'CDL Class A/B', 'OSHA 10'] },
      { name: 'Beauty', icon: Scissors, roles: ['Barber', 'Cosmetologist', 'Esthetician', 'Nail Tech'], certs: ['State Board', 'NHA'] },
      { name: 'Business', icon: Monitor, roles: ['Admin', 'Billing/Coding', 'EHR Specialist', 'Customer Service'], certs: ['RHIT', 'MOS', 'CEHRS'] },
    ],
  },
  {
    id: 'partners',
    title: 'Partner Network',
    subtitle: '3rd party vendors power hands-on training',
    icon: Handshake,
    color: 'bg-blue-600',
    audiences: ['all', 'wioa', 'vr', 'taa'] as Audience[],
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
    audiences: ['all', 'wioa', 'vr', 'employer'] as Audience[],
    features: [
      { title: 'Admin Dashboard', desc: 'Full system oversight - students, programs, payments, reporting' },
      { title: 'Student Portal', desc: 'Self-service learning, progress tracking, credential downloads' },
      { title: 'Employer Portal', desc: 'Track apprentices, verify competencies, approve hours' },
      { title: 'Host Shop Portal', desc: 'Clock in RTI, track OJL, sign off competencies' },
      { title: 'Case Manager View', desc: 'Track outcomes, placement rates, funding utilization' },
    ],
  },
  {
    id: 'funding',
    title: 'Funding Options',
    subtitle: 'Multiple pathways to enrollment',
    icon: DollarSign,
    color: 'bg-teal-600',
    audiences: ['all', 'wioa', 'vr', 'taa'] as Audience[],
    fundingSources: [
      { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, Youth programs' },
      { name: 'WIOA Title III', desc: 'Vocational Rehabilitation services' },
      { name: 'TAA', desc: 'Trade Adjustment Assistance' },
      { name: 'Pell Grant', desc: 'Federal student aid (for eligible programs)' },
      { name: 'VR Services', desc: 'Vocational Rehabilitation case management' },
      { name: 'Employer Sponsorship', desc: 'Company-paid training programs' },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Reporting',
    subtitle: 'Meet all regulatory requirements',
    icon: FileText,
    color: 'bg-indigo-600',
    audiences: ['wioa'] as Audience[],
    points: [
      'DOL-compliant apprenticeship tracking',
      'ETA 9029 job readiness reporting',
      'WIOA performance measures (PPR)',
      'VR service documentation',
      'Outcome tracking & verification',
    ],
  },
];

export default function VRFundingDemoClient() {
  const [activeSection, setActiveSection] = useState(0);
  const [audience, setAudience] = useState<Audience>('all');
  const [copied, setCopied] = useState(false);

  const filteredSections = sections.filter(s =>
    audience === 'all' || s.audiences.includes(audience)
  );
  const safeActiveSection = Math.min(activeSection, filteredSections.length - 1);
  const currentSection = filteredSections[safeActiveSection] || filteredSections[0];

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadDemoContent = () => {
    const content = `ELEVATE FOR HUMANITY - WORKFORCE DEVELOPMENT PLATFORM
==================================================
Interactive Demo for Funding Partners
${new Date().toLocaleDateString()}

LIVE DEMO: https://admin.elevateforhumanity.org
CONTACT: support@elevateforhumanity.org
PHONE: (317) 314-3757

==================================================
SECTIONS
==================================================

${filteredSections.map((section, i) => `
${i + 1}. ${section.title.toUpperCase()}
${section.subtitle}

${section.points ? section.points.map(p => `   • ${p}`).join('\n') : ''}
${section.careers ? section.careers.map(c => `
   ${c.name}:
   ${c.roles.map(r => `   • ${r}`).join('\n')}
   Certifications: ${c.certs.join(', ')}
`).join('\n') : ''}
${section.features ? section.features.map(f => `   • ${f.title}: ${f.desc}`).join('\n') : ''}
${section.fundingSources ? section.fundingSources.map(f => `   • ${f.name}: ${f.desc}`).join('\n') : ''}
`).join('\n')}

==================================================
KEY BENEFITS FOR FUNDING PARTNERS
==================================================

✓ No facilities needed - Partner with existing businesses
✓ Career pathways in Healthcare, Trades, Beauty, Business
✓ Industry-recognized credentials (NHA, EPA 608, State Board)
✓ Real-time tracking dashboard for case managers
✓ Multiple funding sources accepted
✓ Outcome-based reporting

==================================================
CAREER PATHWAYS & CERTIFICATIONS
==================================================

HEALTHCARE
• Medical Assistant (NHA - CCMA)
• Phlebotomy (NHA - CPT)
• EKG Technician (NHA - CET)
• Certified Nursing Assistant

TRADES
• HVAC Technician (EPA 608 Universal)
• CDL Driver (Class A/B)
• Building Maintenance
• Welding (AWS)

BEAUTY
• Barber (State Board)
• Cosmetologist (State Board)
• Esthetician (State Board)
• Nail Technician (State Board)

BUSINESS
• Medical Admin (RHIT)
• Billing & Coding (CPC, CCS)
• EHR Specialist (CEHRS)
• Customer Service (MOS)

==================================================
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elevate-workforce-demo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Navigation */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Elevate for Humanity</h1>
              <p className="text-xs text-slate-400">VR Funding Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadDemoContent}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <a
              href="https://admin.elevateforhumanity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-red-600 hover:bg-brand-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              Live Demo
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-900 py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
            <Video className="w-4 h-4" />
            <span>Interactive Demo • 10 Minutes</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Workforce Training
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Without Boundaries
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            How Elevate prepares participants for careers in healthcare, trades, and business —
            <strong className="text-white"> without requiring massive facilities</strong>,
            by partnering with existing 3rd party vendors for hands-on training.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setActiveSection(0)}
              className="bg-brand-red-600 hover:bg-brand-red-700 px-8 py-4 rounded-xl text-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Demo
            </button>
            <a
              href="https://admin.elevateforhumanity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-xl text-lg font-semibold transition-all flex items-center gap-2"
            >
              <Monitor className="w-5 h-5" />
              Try Live Demo
            </a>
          </div>
        </div>
      </section>

      {/* Audience Selector */}
      <section className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400 text-sm font-medium">Filter for:</span>
            {[
              { id: 'all' as Audience, label: 'All Audiences' },
              { id: 'wioa' as Audience, label: 'WIOA' },
              { id: 'vr' as Audience, label: 'Vocational Rehab' },
              { id: 'taa' as Audience, label: 'TAA' },
              { id: 'employer' as Audience, label: 'Employers' },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => { setAudience(a.id); setActiveSection(0); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  audience === a.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {a.label}
              </button>
            ))}
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

                <div className="p-8">
                  {section.points && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        {section.points.map((point, i) => (
                          <div key={i} className="flex items-start gap-4 bg-slate-700/30 p-4 rounded-lg">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-slate-300">{point}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
                        <h4 className="font-bold text-lg mb-4 text-purple-300">💡 Key Innovation</h4>
                        <p className="text-slate-300 mb-4">We flip the model: theory online, practice locally.</p>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="text-3xl font-bold text-purple-400">85%</div>
                            <div className="text-sm text-slate-400">Online Learning</div>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <div className="text-3xl font-bold text-green-400">15%</div>
                            <div className="text-sm text-slate-400">Hands-On</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.careers && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        Participants can pursue careers in high-demand industries with
                        <strong className="text-white"> industry-recognized credentials</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {section.careers.map((career, i) => (
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
                            <div className="pt-3 border-t border-slate-600">
                              <p className="text-xs text-slate-500 mb-2">Certifications:</p>
                              <div className="flex flex-wrap gap-1">
                                {career.certs.map((cert, k) => (
                                  <span key={k} className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.features && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        A unified dashboard tracks everything —
                        <strong className="text-white"> from enrollment to employment</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.features.map((feature, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
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
                        <p className="text-slate-300 mb-4">Track placement rates, credential attainment, wage gains, and employment retention.</p>
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

                  {section.fundingSources && (
                    <div>
                      <p className="text-slate-300 mb-8 text-lg">
                        Multiple funding pathways make our programs
                        <strong className="text-white"> accessible to participants</strong>.
                      </p>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {section.fundingSources.map((source, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                              <DollarSign className="w-5 h-5 text-teal-400" />
                            </div>
                            <h4 className="font-semibold mb-2">{source.name}</h4>
                            <p className="text-slate-400 text-sm">{source.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-900 via-blue-900 to-purple-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to See It In Action?</h2>
          <p className="text-xl text-slate-300 mb-8">Try our live demo or schedule a personalized walkthrough for your team.</p>
          <div className="flex flex-wrap justify-center gap-4">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>Elevate for Humanity • Workforce Development Platform</p>
          <p className="text-sm mt-2">Contact: support@elevateforhumanity.org • (317) 314-3757</p>
        </div>
      </footer>
    </div>
  );
}
