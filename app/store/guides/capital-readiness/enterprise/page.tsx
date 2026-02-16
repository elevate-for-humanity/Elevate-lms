"use client";

import Link from "next/link";
import { ArrowLeft, Building2, Shield, Globe, Users, FileCheck, Scale, Briefcase, AlertTriangle, Clock, DollarSign } from "lucide-react";

export default function EnterpriseCapitalReadinessPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/store/guides/capital-readiness"
              className="flex items-center gap-2 text-blue-300 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Capital Readiness Guide
            </Link>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
              Level 4: Enterprise
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
            <Building2 className="w-4 h-4" />
            Enterprise & Government Deployment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Advanced Capital Readiness
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Enterprise-grade deployment strategies for large organizations, government agencies, 
            and state-level implementations. Includes compliance frameworks, procurement guidance, 
            and multi-stakeholder coordination.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* Enterprise Overview */}
        <section className="mb-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-400" />
              Enterprise Deployment Overview
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Target Organizations</h3>
                <ul className="space-y-3">
                  {[
                    "State workforce development agencies",
                    "Large nonprofit networks (50+ locations)",
                    "Community college systems",
                    "Regional economic development authorities",
                    "Multi-county collaborative initiatives",
                    "Federal program administrators"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Differentiators</h3>
                <ul className="space-y-3">
                  {[
                    "White-label customization options",
                    "Single sign-on (SSO) integration",
                    "Custom reporting dashboards",
                    "Dedicated implementation support",
                    "SLA-backed uptime guarantees",
                    "Data residency compliance"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Government Procurement */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Scale className="w-6 h-6 text-blue-400" />
            Government Procurement Pathways
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Direct Award",
                timeline: "4-8 weeks",
                threshold: "Under $250K",
                description: "Sole-source justification based on unique methodology and proven outcomes",
                steps: [
                  "Prepare sole-source justification memo",
                  "Document unique capabilities",
                  "Provide outcome evidence",
                  "Complete vendor registration"
                ]
              },
              {
                title: "Competitive RFP",
                timeline: "3-6 months",
                threshold: "$250K+",
                description: "Full competitive process with evaluation criteria favoring evidence-based approaches",
                steps: [
                  "Monitor procurement portals",
                  "Attend pre-bid conferences",
                  "Submit comprehensive proposal",
                  "Prepare for oral presentations"
                ]
              },
              {
                title: "Cooperative Purchasing",
                timeline: "2-4 weeks",
                threshold: "Varies",
                description: "Leverage existing state contracts or cooperative purchasing agreements",
                steps: [
                  "Identify applicable contracts",
                  "Verify eligibility",
                  "Submit purchase order",
                  "Complete onboarding"
                ]
              }
            ].map((pathway, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{pathway.title}</h3>
                <div className="flex gap-4 mb-4">
                  <span className="text-sm text-blue-300 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {pathway.timeline}
                  </span>
                  <span className="text-sm text-green-300 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {pathway.threshold}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{pathway.description}</p>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Key Steps:</h4>
                <ul className="space-y-2">
                  {pathway.steps.map((step, j) => (
                    <li key={j} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400 font-medium">{j + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance Frameworks */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-green-400" />
            Compliance & Security Frameworks
          </h2>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-6 py-4 text-slate-900 font-semibold">Framework</th>
                  <th className="text-left px-6 py-4 text-slate-900 font-semibold">Status</th>
                  <th className="text-left px-6 py-4 text-slate-900 font-semibold">Applicability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { framework: "SOC 2 Type II", status: "Compliant", applicability: "All enterprise deployments" },
                  { framework: "FERPA", status: "Compliant", applicability: "Educational institutions" },
                  { framework: "Section 508 / WCAG 2.1 AA", status: "Compliant", applicability: "Federal & state agencies" },
                  { framework: "StateRAMP", status: "In Progress", applicability: "State government agencies" },
                  { framework: "FedRAMP", status: "Planned 2025", applicability: "Federal agencies" },
                  { framework: "GDPR", status: "Compliant", applicability: "International deployments" }
                ].map((item, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-slate-900 font-medium">{item.framework}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Compliant" 
                          ? "bg-green-500/20 text-green-300" 
                          : item.status === "In Progress"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{item.applicability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Clock className="w-6 h-6 text-red-600" />
            Enterprise Implementation Timeline
          </h2>
          
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-100"></div>
            
            <div className="space-y-8">
              {[
                {
                  phase: "Phase 1: Discovery & Planning",
                  duration: "Weeks 1-4",
                  tasks: [
                    "Stakeholder mapping and engagement",
                    "Technical requirements gathering",
                    "Integration architecture design",
                    "Data migration planning",
                    "Change management strategy"
                  ]
                },
                {
                  phase: "Phase 2: Configuration & Customization",
                  duration: "Weeks 5-10",
                  tasks: [
                    "White-label branding setup",
                    "SSO/SAML integration",
                    "Custom curriculum mapping",
                    "Reporting dashboard configuration",
                    "User role hierarchy setup"
                  ]
                },
                {
                  phase: "Phase 3: Pilot & Testing",
                  duration: "Weeks 11-14",
                  tasks: [
                    "Pilot cohort selection",
                    "User acceptance testing",
                    "Performance benchmarking",
                    "Feedback collection and iteration",
                    "Training material development"
                  ]
                },
                {
                  phase: "Phase 4: Full Deployment",
                  duration: "Weeks 15-20",
                  tasks: [
                    "Phased rollout by region/department",
                    "Train-the-trainer sessions",
                    "Go-live support",
                    "Performance monitoring",
                    "Success metrics tracking"
                  ]
                }
              ].map((phase, i) => (
                <div key={i} className="relative pl-20">
                  <div className="absolute left-6 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-900"></div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">{phase.phase}</h3>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {phase.duration}
                      </span>
                    </div>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {phase.tasks.map((task, j) => (
                        <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                          <span className="text-slate-400 flex-shrink-0">•</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stakeholder Management */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-400" />
            Multi-Stakeholder Coordination
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                role: "Executive Sponsors",
                responsibilities: [
                  "Champion initiative at leadership level",
                  "Secure budget allocation",
                  "Remove organizational barriers",
                  "Communicate strategic alignment"
                ],
                engagement: "Monthly steering committee"
              },
              {
                role: "Program Managers",
                responsibilities: [
                  "Day-to-day implementation oversight",
                  "Coordinate across departments",
                  "Track milestones and deliverables",
                  "Manage vendor relationships"
                ],
                engagement: "Weekly status meetings"
              },
              {
                role: "IT/Security Teams",
                responsibilities: [
                  "Technical integration support",
                  "Security review and approval",
                  "SSO configuration",
                  "Data governance compliance"
                ],
                engagement: "Bi-weekly technical syncs"
              },
              {
                role: "End Users / Coaches",
                responsibilities: [
                  "Participate in pilot programs",
                  "Provide feedback on usability",
                  "Champion adoption among peers",
                  "Report issues and suggestions"
                ],
                engagement: "Ongoing feedback channels"
              }
            ].map((stakeholder, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{stakeholder.role}</h3>
                <ul className="space-y-2 mb-4">
                  {stakeholder.responsibilities.map((resp, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {resp}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-white/10">
                  <span className="text-sm text-cyan-300">
                    <strong>Engagement:</strong> {stakeholder.engagement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Mitigation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            Risk Mitigation Strategies
          </h2>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  risk: "Stakeholder Resistance",
                  mitigation: "Early engagement, clear communication of benefits, pilot success stories, change management support"
                },
                {
                  risk: "Technical Integration Delays",
                  mitigation: "Detailed technical discovery, phased integration approach, dedicated technical resources, fallback options"
                },
                {
                  risk: "Budget Constraints",
                  mitigation: "Flexible pricing models, phased implementation, ROI documentation, grant funding identification"
                },
                {
                  risk: "Data Migration Issues",
                  mitigation: "Comprehensive data audit, validation protocols, parallel running period, rollback procedures"
                },
                {
                  risk: "Low User Adoption",
                  mitigation: "Train-the-trainer programs, gamification elements, success metrics visibility, ongoing support"
                },
                {
                  risk: "Compliance Gaps",
                  mitigation: "Pre-deployment compliance audit, documentation review, legal counsel engagement, remediation timeline"
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-medium mb-1">{item.risk}</h3>
                    <p className="text-gray-400 text-sm">{item.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            Enterprise Pricing Models
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                model: "Per-Seat License",
                price: "$15-25/user/month",
                best: "Organizations with defined user counts",
                includes: [
                  "All platform features",
                  "Standard support",
                  "Quarterly business reviews",
                  "Basic customization"
                ]
              },
              {
                model: "Unlimited Site License",
                price: "Custom pricing",
                best: "Large agencies with variable usage",
                includes: [
                  "Unlimited users",
                  "Premium support",
                  "Dedicated success manager",
                  "Full white-label options"
                ]
              },
              {
                model: "Outcomes-Based",
                price: "Performance-linked",
                best: "Results-focused organizations",
                includes: [
                  "Base platform fee",
                  "Success bonuses",
                  "Shared risk model",
                  "Aligned incentives"
                ]
              }
            ].map((pricing, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{pricing.model}</h3>
                <p className="text-2xl font-bold text-emerald-400 mb-2">{pricing.price}</p>
                <p className="text-sm text-gray-400 mb-4">Best for: {pricing.best}</p>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Includes:</h4>
                <ul className="space-y-2">
                  {pricing.includes.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-300 text-sm">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-blue-500/20 rounded-2xl border border-blue-500/30 p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ready for Enterprise Deployment?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Our enterprise team is ready to discuss your organization's specific needs, 
              compliance requirements, and implementation timeline.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact?type=enterprise"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Schedule Enterprise Consultation
              </Link>
              <Link
                href="/store/guides/capital-readiness"
                className="px-8 py-3 border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition-colors border border-white/20"
              >
                Back to Guide Overview
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
